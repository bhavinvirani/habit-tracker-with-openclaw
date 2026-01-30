import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  BookOpen,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  BookMarked,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import clsx from 'clsx';

interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'reading' | 'completed' | 'paused' | 'want_to_read';
  startDate?: string;
  finishDate?: string;
  createdAt: string;
}

// API functions
const booksApi = {
  getAll: async (): Promise<Book[]> => {
    const response = await api.get('/books');
    return response.data.data.books;
  },
  create: async (book: Partial<Book>): Promise<Book> => {
    const response = await api.post('/books', book);
    return response.data.data.book;
  },
  update: async (id: string, book: Partial<Book>): Promise<Book> => {
    const response = await api.patch(`/books/${id}`, book);
    return response.data.data.book;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/books/${id}`);
  },
  updateProgress: async (id: string, currentPage: number): Promise<Book> => {
    const response = await api.patch(`/books/${id}/progress`, { currentPage });
    return response.data.data.book;
  },
};

const Books: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    totalPages: 0,
    currentPage: 0,
    status: 'want_to_read' as Book['status'],
  });

  // Fetch books
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: booksApi.getAll,
  });

  // Create book
  const createMutation = useMutation({
    mutationFn: booksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Book added successfully!');
    },
    onError: () => toast.error('Failed to add book'),
  });

  // Update book
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Book> }) => booksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setIsModalOpen(false);
      setEditingBook(null);
      resetForm();
      toast.success('Book updated!');
    },
    onError: () => toast.error('Failed to update book'),
  });

  // Delete book
  const deleteMutation = useMutation({
    mutationFn: booksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book removed');
    },
    onError: () => toast.error('Failed to remove book'),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      totalPages: 0,
      currentPage: 0,
      status: 'want_to_read',
    });
  };

  const handleOpenModal = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        totalPages: book.totalPages,
        currentPage: book.currentPage,
        status: book.status,
      });
    } else {
      setEditingBook(null);
      resetForm();
    }
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this book?')) {
      deleteMutation.mutate(id);
    }
    setActiveMenu(null);
  };

  const getStatusColor = (status: Book['status']) => {
    switch (status) {
      case 'reading':
        return 'text-primary-400 bg-primary-500/20';
      case 'completed':
        return 'text-accent-green bg-accent-green/20';
      case 'paused':
        return 'text-accent-yellow bg-accent-yellow/20';
      case 'want_to_read':
        return 'text-dark-400 bg-dark-700';
    }
  };

  const getStatusLabel = (status: Book['status']) => {
    switch (status) {
      case 'reading':
        return 'Reading';
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      case 'want_to_read':
        return 'Want to Read';
    }
  };

  const currentlyReading = books.filter((b) => b.status === 'reading');
  const otherBooks = books.filter((b) => b.status !== 'reading');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Books</h1>
          <p className="text-dark-400 mt-1">Track your reading progress</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          Add Book
        </button>
      </div>

      {/* Currently Reading */}
      {currentlyReading.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Currently Reading</h2>
          <div className="grid gap-4">
            {currentlyReading.map((book) => {
              const progress = Math.round((book.currentPage / book.totalPages) * 100);
              return (
                <div key={book.id} className="card-hover">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-16 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={24} className="text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{book.title}</h3>
                      <p className="text-sm text-dark-400">{book.author}</p>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-dark-400">
                            Page {book.currentPage} of {book.totalPages}
                          </span>
                          <span className="text-primary-400">{progress}%</span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === book.id ? null : book.id)}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {activeMenu === book.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-20 overflow-hidden">
                            <button
                              onClick={() => handleOpenModal(book)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-200 hover:bg-dark-700"
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(book.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-red hover:bg-dark-700"
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Books */}
      {books.length === 0 ? (
        <div className="card text-center py-16">
          <BookMarked className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No books yet</h3>
          <p className="text-dark-400 mb-6">Start tracking your reading journey</p>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus size={18} />
            Add Your First Book
          </button>
        </div>
      ) : (
        otherBooks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Library</h2>
            <div className="grid gap-3">
              {otherBooks.map((book) => (
                <div key={book.id} className="card flex items-center gap-4">
                  <div className="w-10 h-14 rounded bg-dark-700 flex items-center justify-center">
                    <BookOpen size={18} className="text-dark-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{book.title}</h3>
                    <p className="text-sm text-dark-500">{book.author}</p>
                  </div>
                  <span className={clsx('badge', getStatusColor(book.status))}>
                    {getStatusLabel(book.status)}
                  </span>
                  <button
                    onClick={() => handleOpenModal(book)}
                    className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-xl font-semibold text-white">
                {editingBook ? 'Edit Book' : 'Add Book'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Author</label>
                <input
                  type="text"
                  className="input"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Pages</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.totalPages}
                    onChange={(e) =>
                      setFormData({ ...formData, totalPages: parseInt(e.target.value) || 0 })
                    }
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="label">Current Page</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.currentPage}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPage: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                    max={formData.totalPages}
                  />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as Book['status'] })
                  }
                >
                  <option value="want_to_read">Want to Read</option>
                  <option value="reading">Reading</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingBook ? 'Save' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
