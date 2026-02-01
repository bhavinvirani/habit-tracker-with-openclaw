import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  X,
  Star,
  Library,
  Filter,
  Calendar,
  FileText,
  Bookmark,
  CheckCircle,
  Clock,
  Target,
  Play,
  Minus,
  RotateCcw,
  Loader2,
  Search,
} from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';
import clsx from 'clsx';
import { CircularProgress } from '../components/ui';
import { BOOK_STATUS_CONFIG, type BookStatus } from '../constants/status';

interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number | null;
  currentPage: number;
  status: BookStatus;
  rating: number | null;
  notes: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReadingLog {
  id: string;
  date: string;
  pagesRead: number;
  notes: string | null;
}

// API functions
const booksApi = {
  getAll: async (): Promise<Book[]> => {
    const response = await api.get('/books');
    return response.data.data.books;
  },
  getById: async (id: string): Promise<Book & { readingLogs: ReadingLog[] }> => {
    const response = await api.get(`/books/${id}`);
    return response.data.data;
  },
  create: async (book: Partial<Book>): Promise<Book> => {
    const response = await api.post('/books', book);
    return response.data.data;
  },
  update: async (id: string, book: Partial<Book>): Promise<Book> => {
    const response = await api.put(`/books/${id}`, book);
    return response.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/books/${id}`);
  },
  updateProgress: async (id: string, currentPage: number): Promise<Book> => {
    const response = await api.put(`/books/${id}/progress`, { currentPage });
    return response.data.data;
  },
  logReading: async (
    id: string,
    data: { pagesRead: number; date?: string; notes?: string }
  ): Promise<void> => {
    await api.post(`/books/${id}/log`, data);
  },
};

const Books: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [filterStatus, setFilterStatus] = useState<BookStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [inlineEditingBook, setInlineEditingBook] = useState<string | null>(null);
  const [inlinePageValue, setInlinePageValue] = useState('');
  const pageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    coverUrl: '',
    totalPages: '',
    currentPage: '0',
    status: 'WANT_TO_READ' as BookStatus,
    rating: null as number | null,
    notes: '',
  });

  // Fetch books
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => booksApi.getAll(),
  });

  // Fetch book details
  const { data: bookDetails } = useQuery({
    queryKey: ['book', selectedBook?.id],
    queryFn: () => (selectedBook ? booksApi.getById(selectedBook.id) : null),
    enabled: !!selectedBook && isDetailOpen,
  });

  // Create book
  const createMutation = useMutation({
    mutationFn: booksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Book added to your library!');
    },
    onError: () => toast.error('Failed to add book'),
  });

  // Update book
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Book> }) => booksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', selectedBook?.id] });
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
      setIsDetailOpen(false);
      setSelectedBook(null);
      toast.success('Book removed from library');
    },
    onError: () => toast.error('Failed to remove book'),
  });

  // Update progress
  const progressMutation = useMutation({
    mutationFn: ({ id, currentPage }: { id: string; currentPage: number }) =>
      booksApi.updateProgress(id, currentPage),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', id] });
    },
  });

  // Log reading
  const logReadingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { pagesRead: number } }) =>
      booksApi.logReading(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', id] });
      toast.success('Progress saved!');
    },
    onError: () => toast.error('Failed to save progress'),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      coverUrl: '',
      totalPages: '',
      currentPage: '0',
      status: 'WANT_TO_READ',
      rating: null,
      notes: '',
    });
  };

  const handleOpenModal = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author || '',
        coverUrl: book.coverUrl || '',
        totalPages: book.totalPages?.toString() || '',
        currentPage: book.currentPage.toString(),
        status: book.status,
        rating: book.rating,
        notes: book.notes || '',
      });
    } else {
      setEditingBook(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleOpenDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title: formData.title,
      author: formData.author || undefined,
      coverUrl: formData.coverUrl || undefined,
      totalPages: formData.totalPages ? parseInt(formData.totalPages) : undefined,
      currentPage: parseInt(formData.currentPage) || 0,
      status: formData.status,
      rating: formData.rating,
      notes: formData.notes || undefined,
    };

    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this book from your library?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdateProgress = (book: Book, newPage: number) => {
    const maxPage = book.totalPages || 99999;
    const validPage = Math.max(0, Math.min(newPage, maxPage));
    const pagesRead = validPage - book.currentPage;

    progressMutation.mutate({ id: book.id, currentPage: validPage });

    if (pagesRead > 0) {
      logReadingMutation.mutate({ id: book.id, data: { pagesRead } });
    }

    // Update local state for selectedBook if it's the same book
    if (selectedBook?.id === book.id) {
      setSelectedBook({ ...selectedBook, currentPage: validPage });
    }
  };

  const handleInlinePageSubmit = (book: Book) => {
    const newPage = parseInt(inlinePageValue);
    if (!isNaN(newPage) && newPage >= 0) {
      handleUpdateProgress(book, newPage);
    }
    setInlineEditingBook(null);
    setInlinePageValue('');
  };

  const startInlineEdit = (book: Book) => {
    setInlineEditingBook(book.id);
    setInlinePageValue(book.currentPage.toString());
    setTimeout(() => pageInputRef.current?.focus(), 50);
  };

  // Start reading a book
  const handleStartReading = (book: Book) => {
    updateMutation.mutate({
      id: book.id,
      data: { status: 'READING', startedAt: new Date().toISOString() },
    });
  };

  // Mark book as finished
  const handleFinishBook = (book: Book) => {
    updateMutation.mutate({
      id: book.id,
      data: {
        status: 'FINISHED',
        finishedAt: new Date().toISOString(),
        currentPage: book.totalPages || book.currentPage,
      },
    });
  };

  // Read book again (restart from page 0)
  const handleReadAgain = (book: Book) => {
    updateMutation.mutate({
      id: book.id,
      data: {
        status: 'READING',
        currentPage: 0,
        startedAt: new Date().toISOString(),
        finishedAt: null,
      },
    });
    toast.success('Starting fresh! Happy re-reading!');
  };

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (filterStatus !== 'ALL' && book.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(query) || book.author?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [books, filterStatus, searchQuery]);

  // Group books by status
  const groupedBooks = useMemo(() => {
    const groups: Record<BookStatus, Book[]> = {
      READING: [],
      WANT_TO_READ: [],
      FINISHED: [],
      ABANDONED: [],
    };
    filteredBooks.forEach((book) => {
      groups[book.status].push(book);
    });
    return groups;
  }, [filteredBooks]);

  // Stats
  const stats = useMemo(() => {
    const reading = books.filter((b) => b.status === 'READING').length;
    const finished = books.filter((b) => b.status === 'FINISHED').length;
    const totalPagesRead = books.reduce((sum, b) => sum + b.currentPage, 0);
    const ratedBooks = books.filter((b) => b.rating);
    const avgRating =
      ratedBooks.length > 0
        ? ratedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBooks.length
        : 0;

    return { reading, finished, totalPagesRead, avgRating: avgRating.toFixed(1) };
  }, [books]);

  // All currently reading books sorted by most recently updated
  const readingBooks = useMemo(() => {
    return books
      .filter((b) => b.status === 'READING')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [books]);

  const getProgressPercent = (book: Book) => {
    if (!book.totalPages) return 0;
    return Math.round((book.currentPage / book.totalPages) * 100);
  };

  // Estimate finish date based on reading pace
  const getEstimatedFinishDate = (book: Book) => {
    if (!book.totalPages || !book.startedAt || book.currentPage === 0) return null;
    const daysReading = Math.max(1, differenceInDays(new Date(), parseISO(book.startedAt)));
    const pagesPerDay = book.currentPage / daysReading;
    const pagesRemaining = book.totalPages - book.currentPage;
    const daysRemaining = Math.ceil(pagesRemaining / pagesPerDay);
    return addDays(new Date(), daysRemaining);
  };

  const renderStars = (
    rating: number | null,
    size: 'sm' | 'lg' = 'sm',
    interactive = false,
    onChange?: (r: number) => void
  ) => {
    const stars = [];
    const starSize = size === 'sm' ? 14 : 20;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i)}
          className={clsx(
            'transition-colors',
            interactive && 'hover:scale-110 cursor-pointer',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            size={starSize}
            className={clsx(
              i <= (rating || 0) ? 'fill-accent-yellow text-accent-yellow' : 'text-dark-600'
            )}
          />
        </button>
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Library</h1>
          <p className="text-dark-400 mt-1">Track your reading journey</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          Add Book
        </button>
      </div>

      {/* Currently Reading Section - Handles 1, 2, 3+ books */}
      {readingBooks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-primary-400" />
            Currently Reading
            {readingBooks.length > 1 && (
              <span className="text-sm font-normal text-dark-400">
                ({readingBooks.length} books)
              </span>
            )}
          </h2>

          {/* Single book - Hero layout */}
          {readingBooks.length === 1 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900/40 via-dark-800 to-dark-800 border border-primary-500/20">
              {readingBooks[0].coverUrl && (
                <div
                  className="absolute inset-0 opacity-10 blur-3xl"
                  style={{
                    backgroundImage: `url(${readingBooks[0].coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}
              <div className="relative p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div
                    className="w-32 h-48 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl cursor-pointer hover:scale-105 transition-transform mx-auto md:mx-0"
                    onClick={() => handleOpenDetail(readingBooks[0])}
                  >
                    {readingBooks[0].coverUrl ? (
                      <img
                        src={readingBooks[0].coverUrl}
                        alt={readingBooks[0].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-600/30 to-primary-800/30 flex items-center justify-center">
                        <BookOpen size={40} className="text-primary-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h2
                      className="text-2xl font-bold text-white line-clamp-2 cursor-pointer hover:text-primary-400 transition-colors text-center md:text-left"
                      onClick={() => handleOpenDetail(readingBooks[0])}
                    >
                      {readingBooks[0].title}
                    </h2>
                    <p className="text-dark-400 mt-1 text-center md:text-left">
                      {readingBooks[0].author || 'Unknown Author'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
                      <CircularProgress percent={getProgressPercent(readingBooks[0])} />
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <button
                          onClick={() => startInlineEdit(readingBooks[0])}
                          className="text-lg font-semibold text-white hover:text-primary-400 transition-colors"
                        >
                          Page {readingBooks[0].currentPage}{' '}
                          <span className="text-dark-400 font-normal">
                            of {readingBooks[0].totalPages || '?'}
                          </span>
                        </button>
                        {readingBooks[0].totalPages && (
                          <p className="text-sm text-dark-400">
                            {readingBooks[0].totalPages - readingBooks[0].currentPage} pages left
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                      {[5, 10, 25, 50].map((pages) => (
                        <button
                          key={pages}
                          onClick={() =>
                            handleUpdateProgress(
                              readingBooks[0],
                              readingBooks[0].currentPage + pages
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-primary-600/20 text-primary-300 hover:bg-primary-600 hover:text-white transition-colors text-sm font-medium"
                        >
                          +{pages}
                        </button>
                      ))}
                      {readingBooks[0].totalPages &&
                        readingBooks[0].currentPage < readingBooks[0].totalPages && (
                          <button
                            onClick={() => handleFinishBook(readingBooks[0])}
                            className="px-4 py-2 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green hover:text-white transition-colors text-sm font-medium sm:ml-auto"
                          >
                            <CheckCircle size={14} className="inline mr-1" />
                            Finish
                          </button>
                        )}
                    </div>
                    {readingBooks[0].totalPages && (
                      <div className="mt-4">
                        <input
                          type="range"
                          min={0}
                          max={readingBooks[0].totalPages}
                          value={readingBooks[0].currentPage}
                          onChange={(e) => {
                            const newPage = parseInt(e.target.value);
                            progressMutation.mutate({
                              id: readingBooks[0].id,
                              currentPage: newPage,
                            });
                          }}
                          className="w-full h-2 bg-dark-700 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #6366f1 ${getProgressPercent(readingBooks[0])}%, #374151 ${getProgressPercent(readingBooks[0])}%)`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple books - Equal cards grid */}
          {readingBooks.length >= 2 && (
            <div
              className={clsx(
                'grid gap-4',
                readingBooks.length === 2 && 'grid-cols-1 lg:grid-cols-2',
                readingBooks.length >= 3 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              )}
            >
              {readingBooks.map((book) => {
                const progress = getProgressPercent(book);
                return (
                  <div
                    key={book.id}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-900/20 via-dark-800 to-dark-800 border border-dark-700 hover:border-primary-500/30 transition-all"
                  >
                    {/* Subtle background */}
                    {book.coverUrl && (
                      <div
                        className="absolute inset-0 opacity-5 blur-2xl"
                        style={{
                          backgroundImage: `url(${book.coverUrl})`,
                          backgroundSize: 'cover',
                        }}
                      />
                    )}

                    <div className="relative p-4">
                      <div className="flex gap-4">
                        {/* Cover */}
                        <div
                          className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => handleOpenDetail(book)}
                        >
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-600/30 to-primary-800/30 flex items-center justify-center">
                              <BookOpen size={24} className="text-primary-400" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-white line-clamp-2 cursor-pointer hover:text-primary-400 transition-colors"
                            onClick={() => handleOpenDetail(book)}
                          >
                            {book.title}
                          </h3>
                          <p className="text-sm text-dark-400 truncate mt-0.5">
                            {book.author || 'Unknown Author'}
                          </p>

                          {/* Progress */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <button
                                onClick={() => startInlineEdit(book)}
                                className="text-sm text-white hover:text-primary-400 transition-colors"
                              >
                                {book.currentPage}/{book.totalPages || '?'}
                              </button>
                              <span className="text-sm font-medium text-primary-400">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[10, 25, 50].map((pages) => (
                          <button
                            key={pages}
                            onClick={() => handleUpdateProgress(book, book.currentPage + pages)}
                            className="flex-1 py-1.5 rounded-lg bg-dark-700/50 text-dark-300 hover:bg-primary-600 hover:text-white transition-colors text-xs font-medium"
                          >
                            +{pages}
                          </button>
                        ))}
                        {book.totalPages && book.currentPage < book.totalPages && (
                          <button
                            onClick={() => handleFinishBook(book)}
                            className="py-1.5 px-3 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green hover:text-white transition-colors text-xs font-medium"
                          >
                            ✓
                          </button>
                        )}
                      </div>

                      {/* Slider */}
                      {book.totalPages && (
                        <div className="mt-3">
                          <input
                            type="range"
                            min={0}
                            max={book.totalPages}
                            value={book.currentPage}
                            onChange={(e) => {
                              const newPage = parseInt(e.target.value);
                              progressMutation.mutate({
                                id: book.id,
                                currentPage: newPage,
                              });
                            }}
                            className="w-full h-1.5 bg-dark-700 rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #6366f1 ${progress}%, #374151 ${progress}%)`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inline Page Edit Modal */}
      {inlineEditingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setInlineEditingBook(null);
              setInlinePageValue('');
            }}
          />
          <div className="relative bg-dark-800 rounded-xl p-6 border border-dark-700 shadow-2xl w-80">
            <h3 className="text-lg font-semibold text-white mb-4">Update Page</h3>
            <input
              ref={pageInputRef}
              type="number"
              value={inlinePageValue}
              onChange={(e) => setInlinePageValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const book = books.find((b) => b.id === inlineEditingBook);
                  if (book) handleInlinePageSubmit(book);
                }
                if (e.key === 'Escape') {
                  setInlineEditingBook(null);
                  setInlinePageValue('');
                }
              }}
              className="input w-full text-center text-2xl py-3"
              min={0}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setInlineEditingBook(null);
                  setInlinePageValue('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const book = books.find((b) => b.id === inlineEditingBook);
                  if (book) handleInlinePageSubmit(book);
                }}
                className="btn btn-primary flex-1"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-600/20 to-primary-600/5 border-primary-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <BookOpen size={20} className="text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.reading}</p>
              <p className="text-xs text-dark-400">Currently Reading</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-green/20 to-accent-green/5 border-accent-green/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-green/20">
              <CheckCircle size={20} className="text-accent-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.finished}</p>
              <p className="text-xs text-dark-400">Books Finished</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dark-700">
              <FileText size={20} className="text-dark-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.totalPagesRead.toLocaleString()}
              </p>
              <p className="text-xs text-dark-400">Pages Read</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-yellow/20">
              <Star size={20} className="text-accent-yellow" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgRating}</p>
              <p className="text-xs text-dark-400">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx('btn btn-secondary', showFilters && 'bg-dark-700')}
        >
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* Filter Pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={clsx(
              'badge cursor-pointer transition-all',
              filterStatus === 'ALL'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            )}
          >
            All ({books.length})
          </button>
          {(Object.keys(BOOK_STATUS_CONFIG) as BookStatus[]).map((status) => {
            const config = BOOK_STATUS_CONFIG[status];
            const count = books.filter((b) => b.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={clsx(
                  'badge cursor-pointer transition-all',
                  filterStatus === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                )}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Want to Read Section */}
      {groupedBooks.WANT_TO_READ.length > 0 &&
        (filterStatus === 'ALL' || filterStatus === 'WANT_TO_READ') && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bookmark size={20} className="text-dark-400" />
              Want to Read
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {groupedBooks.WANT_TO_READ.map((book) => (
                <div key={book.id} className="group">
                  {/* Cover */}
                  <div
                    className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-dark-700 to-dark-800 relative mb-3 cursor-pointer group-hover:ring-2 ring-primary-500 transition-all"
                    onClick={() => handleOpenDetail(book)}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <BookOpen size={32} className="text-dark-500 mb-2" />
                        <p className="text-xs text-dark-500 text-center line-clamp-3">
                          {book.title}
                        </p>
                      </div>
                    )}

                    {/* Start Reading Overlay */}
                    <div className="absolute inset-0 bg-dark-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartReading(book);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <Play size={14} />
                        Start Reading
                      </button>
                    </div>
                  </div>

                  <h3
                    className="font-medium text-white text-sm line-clamp-2 cursor-pointer group-hover:text-primary-400 transition-colors"
                    onClick={() => handleOpenDetail(book)}
                  >
                    {book.title}
                  </h3>
                  <p className="text-xs text-dark-500 truncate mt-1">
                    {book.author || 'Unknown Author'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Finished & Abandoned Books Grid */}
      {(groupedBooks.FINISHED.length > 0 || groupedBooks.ABANDONED.length > 0) &&
        (filterStatus === 'ALL' || filterStatus === 'FINISHED' || filterStatus === 'ABANDONED') && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Library size={20} className="text-dark-400" />
              {filterStatus === 'ABANDONED'
                ? 'Abandoned'
                : filterStatus === 'FINISHED'
                  ? 'Finished'
                  : 'Library'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[
                ...(filterStatus === 'ABANDONED' ? [] : groupedBooks.FINISHED),
                ...(filterStatus === 'FINISHED' ? [] : groupedBooks.ABANDONED),
              ].map((book) => {
                const config = BOOK_STATUS_CONFIG[book.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={book.id}
                    className="group cursor-pointer"
                    onClick={() => handleOpenDetail(book)}
                  >
                    {/* Cover */}
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-dark-700 to-dark-800 relative mb-3 group-hover:ring-2 ring-primary-500 transition-all">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <BookOpen size={32} className="text-dark-500 mb-2" />
                          <p className="text-xs text-dark-500 text-center line-clamp-3">
                            {book.title}
                          </p>
                        </div>
                      )}

                      {/* Status Badge */}
                      <div
                        className={clsx('absolute top-2 right-2 p-1.5 rounded-lg', config.bgColor)}
                      >
                        <StatusIcon size={14} className={config.color} />
                      </div>

                      {/* Rating Overlay */}
                      {book.rating && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-dark-900/80 rounded-lg px-2 py-1">
                          <Star size={12} className="fill-accent-yellow text-accent-yellow" />
                          <span className="text-xs text-white">{book.rating}</span>
                        </div>
                      )}

                      {/* Read Again Overlay */}
                      <div className="absolute inset-0 bg-dark-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReadAgain(book);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          <RotateCcw size={14} />
                          Read Again
                        </button>
                      </div>
                    </div>

                    <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-primary-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-dark-500 truncate mt-1">
                      {book.author || 'Unknown Author'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Empty State */}
      {filteredBooks.length === 0 && (
        <div className="card text-center py-16">
          <Library className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery || filterStatus !== 'ALL' ? 'No books found' : 'Your library is empty'}
          </h3>
          <p className="text-dark-400 mb-6">
            {searchQuery || filterStatus !== 'ALL'
              ? 'Try a different search or filter'
              : 'Start building your reading collection'}
          </p>
          {!searchQuery && filterStatus === 'ALL' && (
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              <Plus size={18} />
              Add Your First Book
            </button>
          )}
        </div>
      )}

      {/* Book Detail Slide-over */}
      {isDetailOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="ml-auto w-full max-w-lg bg-dark-800 border-l border-dark-700 h-full overflow-y-auto relative animate-slide-in-right">
            {/* Close Button */}
            <button
              onClick={() => setIsDetailOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-dark-700 text-dark-400 hover:text-white z-10"
            >
              <X size={20} />
            </button>

            {/* Cover Header */}
            <div className="relative h-64 bg-gradient-to-b from-primary-900/30 to-dark-800">
              {selectedBook.coverUrl && (
                <img
                  src={selectedBook.coverUrl}
                  alt={selectedBook.title}
                  className="w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex gap-4">
                <div className="w-28 h-40 rounded-lg overflow-hidden flex-shrink-0 shadow-2xl bg-dark-700">
                  {selectedBook.coverUrl ? (
                    <img
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={32} className="text-dark-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-8">
                  <span
                    className={clsx(
                      'badge mb-2',
                      BOOK_STATUS_CONFIG[selectedBook.status].bgColor,
                      BOOK_STATUS_CONFIG[selectedBook.status].color
                    )}
                  >
                    {BOOK_STATUS_CONFIG[selectedBook.status].label}
                  </span>
                  <h2 className="text-xl font-bold text-white line-clamp-2">
                    {selectedBook.title}
                  </h2>
                  <p className="text-dark-400">{selectedBook.author || 'Unknown Author'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating */}
              <div>
                <label className="text-sm text-dark-400 block mb-2">Your Rating</label>
                {renderStars(selectedBook.rating, 'lg', true, (rating) => {
                  updateMutation.mutate({ id: selectedBook.id, data: { rating } });
                  setSelectedBook({ ...selectedBook, rating });
                })}
              </div>

              {/* Progress Section - Enhanced */}
              {selectedBook.status === 'READING' && (
                <div className="card bg-dark-900/50">
                  <h3 className="font-medium text-white mb-4">Reading Progress</h3>

                  <div className="flex items-center gap-4 mb-4">
                    <CircularProgress percent={getProgressPercent(selectedBook)} />
                    <div className="flex-1">
                      {/* Click to edit page number */}
                      <div className="flex items-center gap-2">
                        {inlineEditingBook === selectedBook.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              ref={pageInputRef}
                              type="number"
                              value={inlinePageValue}
                              onChange={(e) => setInlinePageValue(e.target.value)}
                              onBlur={() => handleInlinePageSubmit(selectedBook)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlinePageSubmit(selectedBook);
                                if (e.key === 'Escape') {
                                  setInlineEditingBook(null);
                                  setInlinePageValue('');
                                }
                              }}
                              className="w-20 input text-center py-1"
                              min={0}
                              max={selectedBook.totalPages || undefined}
                            />
                            <span className="text-dark-400">
                              / {selectedBook.totalPages || '?'}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => startInlineEdit(selectedBook)}
                            className="text-2xl font-bold text-white hover:text-primary-400 transition-colors"
                            title="Click to edit page number"
                          >
                            {selectedBook.currentPage}
                            <span className="text-lg text-dark-400 font-normal ml-1">
                              / {selectedBook.totalPages || '?'}
                            </span>
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-dark-400 mt-1">
                        {selectedBook.totalPages
                          ? `${selectedBook.totalPages - selectedBook.currentPage} pages left`
                          : 'Click to set page'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Slider */}
                  {selectedBook.totalPages && (
                    <div className="mb-4">
                      <input
                        type="range"
                        min={0}
                        max={selectedBook.totalPages}
                        value={selectedBook.currentPage}
                        onChange={(e) => {
                          const newPage = parseInt(e.target.value);
                          setSelectedBook({ ...selectedBook, currentPage: newPage });
                        }}
                        onMouseUp={(e) => {
                          const newPage = parseInt((e.target as HTMLInputElement).value);
                          handleUpdateProgress(selectedBook, newPage);
                        }}
                        onTouchEnd={(e) => {
                          const newPage = parseInt((e.target as HTMLInputElement).value);
                          handleUpdateProgress(selectedBook, newPage);
                        }}
                        className="w-full h-2 bg-dark-700 rounded-full appearance-none cursor-pointer accent-primary-500"
                        style={{
                          background: `linear-gradient(to right, #6366f1 ${getProgressPercent(selectedBook)}%, #374151 ${getProgressPercent(selectedBook)}%)`,
                        }}
                      />
                    </div>
                  )}

                  {/* Quick Progress Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        handleUpdateProgress(
                          selectedBook,
                          Math.max(0, selectedBook.currentPage - 10)
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-white transition-colors text-sm flex items-center gap-1"
                    >
                      <Minus size={14} />
                      10
                    </button>
                    {[5, 10, 25, 50, 100].map((pages) => (
                      <button
                        key={pages}
                        onClick={() =>
                          handleUpdateProgress(selectedBook, selectedBook.currentPage + pages)
                        }
                        className="flex-1 py-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-primary-600 hover:text-white transition-colors text-sm"
                      >
                        +{pages}
                      </button>
                    ))}
                  </div>

                  {/* Finish Button */}
                  {selectedBook.totalPages &&
                    selectedBook.currentPage < selectedBook.totalPages && (
                      <button
                        onClick={() => handleFinishBook(selectedBook)}
                        className="w-full mt-3 py-2 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Mark as Finished
                      </button>
                    )}

                  {/* Estimated Finish */}
                  {getEstimatedFinishDate(selectedBook) && (
                    <div className="mt-4 pt-4 border-t border-dark-700 flex items-center gap-2 text-sm text-dark-400">
                      <Target size={14} />
                      <span>
                        At your current pace, you'll finish by{' '}
                        <span className="text-white">
                          {format(getEstimatedFinishDate(selectedBook)!, 'MMM d, yyyy')}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Want to Read - Start Reading Button */}
              {selectedBook.status === 'WANT_TO_READ' && (
                <button
                  onClick={() => handleStartReading(selectedBook)}
                  className="w-full py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  Start Reading
                </button>
              )}

              {/* Finished/Abandoned - Read Again Button */}
              {(selectedBook.status === 'FINISHED' || selectedBook.status === 'ABANDONED') && (
                <button
                  onClick={() => handleReadAgain(selectedBook)}
                  className="w-full py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Read Again
                </button>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                {selectedBook.totalPages && (
                  <div className="card bg-dark-900/50">
                    <FileText size={18} className="text-dark-400 mb-1" />
                    <p className="text-lg font-semibold text-white">{selectedBook.totalPages}</p>
                    <p className="text-xs text-dark-500">Pages</p>
                  </div>
                )}
                {selectedBook.startedAt && (
                  <div className="card bg-dark-900/50">
                    <Calendar size={18} className="text-dark-400 mb-1" />
                    <p className="text-lg font-semibold text-white">
                      {format(parseISO(selectedBook.startedAt), 'MMM d')}
                    </p>
                    <p className="text-xs text-dark-500">Started</p>
                  </div>
                )}
                {selectedBook.finishedAt && (
                  <div className="card bg-dark-900/50">
                    <CheckCircle size={18} className="text-accent-green mb-1" />
                    <p className="text-lg font-semibold text-white">
                      {format(parseISO(selectedBook.finishedAt), 'MMM d')}
                    </p>
                    <p className="text-xs text-dark-500">Finished</p>
                  </div>
                )}
                {selectedBook.startedAt && selectedBook.finishedAt && (
                  <div className="card bg-dark-900/50">
                    <Clock size={18} className="text-dark-400 mb-1" />
                    <p className="text-lg font-semibold text-white">
                      {differenceInDays(
                        parseISO(selectedBook.finishedAt),
                        parseISO(selectedBook.startedAt)
                      )}
                    </p>
                    <p className="text-xs text-dark-500">Days to Read</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedBook.notes && (
                <div>
                  <h3 className="font-medium text-white mb-2">Notes</h3>
                  <p className="text-dark-400 text-sm whitespace-pre-wrap">{selectedBook.notes}</p>
                </div>
              )}

              {/* Reading Logs */}
              {bookDetails?.readingLogs && bookDetails.readingLogs.length > 0 && (
                <div>
                  <h3 className="font-medium text-white mb-3">Recent Reading Sessions</h3>
                  <div className="space-y-2">
                    {bookDetails.readingLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-900/50"
                      >
                        <span className="text-sm text-dark-400">
                          {format(parseISO(log.date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-sm text-white font-medium">
                          {log.pagesRead} pages
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-dark-700">
                <button
                  onClick={() => {
                    handleOpenModal(selectedBook);
                    setIsDetailOpen(false);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedBook.id)}
                  className="btn bg-accent-red/20 text-accent-red hover:bg-accent-red/30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingBook ? 'Edit Book' : 'Add Book'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Book title"
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
                  placeholder="Author name"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Cover URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                />
                {formData.coverUrl && (
                  <div className="mt-2 w-20 h-28 rounded-lg overflow-hidden">
                    <img
                      src={formData.coverUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Pages</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    value={formData.totalPages}
                    onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="label">Current Page</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.currentPage}
                    onChange={(e) => setFormData({ ...formData, currentPage: e.target.value })}
                    min={0}
                    max={formData.totalPages ? parseInt(formData.totalPages) : undefined}
                  />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(BOOK_STATUS_CONFIG) as BookStatus[]).map((status) => {
                    const config = BOOK_STATUS_CONFIG[status];
                    const StatusIcon = config.icon;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={clsx(
                          'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                          formData.status === status
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                        )}
                      >
                        <StatusIcon size={16} className={config.color} />
                        <span className="text-sm text-white">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label">Rating</label>
                {renderStars(formData.rating, 'lg', true, (rating) =>
                  setFormData({ ...formData, rating })
                )}
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input min-h-[100px] resize-none"
                  placeholder="Your thoughts about this book..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
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
                  {editingBook ? 'Save Changes' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default Books;
