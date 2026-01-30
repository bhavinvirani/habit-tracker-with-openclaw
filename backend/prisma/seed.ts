import {
  PrismaClient,
  Frequency,
  HabitType,
  MilestoneType,
  BookStatus,
  ChallengeStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data for fresh seed
  await prisma.challengeProgress.deleteMany({});
  await prisma.challengeHabit.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.readingLog.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.habitLog.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.habit.deleteMany({});
  console.log('🧹 Cleaned up existing data');

  // ============ SEED HABIT TEMPLATES ============
  await seedTemplates();

  // ============ CREATE TEST USER ============
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Alex Johnson',
    },
  });

  console.log('✅ Created test user:', user.email);

  // ============ CREATE DIVERSE HABITS ============
  // Various creation dates for realistic testing
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const habits = await Promise.all([
    // ===== DAILY HABITS =====

    // 1. Morning Exercise - High performer, long streak
    prisma.habit.create({
      data: {
        id: 'habit-exercise',
        userId: user.id,
        name: 'Morning Exercise',
        description: 'Do 30 minutes of exercise every morning',
        frequency: Frequency.DAILY,
        habitType: HabitType.DURATION,
        targetValue: 30,
        unit: 'minutes',
        color: '#10b981',
        icon: '🏃',
        category: 'Fitness',
        sortOrder: 0,
        isActive: true,
        createdAt: daysAgo(90),
      },
    }),

    // 2. Reading - Consistent performer
    prisma.habit.create({
      data: {
        id: 'habit-reading',
        userId: user.id,
        name: 'Read Books',
        description: 'Read at least 20 pages daily',
        frequency: Frequency.DAILY,
        habitType: HabitType.NUMERIC,
        targetValue: 20,
        unit: 'pages',
        color: '#f59e0b',
        icon: '📚',
        category: 'Learning',
        sortOrder: 1,
        isActive: true,
        createdAt: daysAgo(90),
      },
    }),

    // 3. Meditation - Improving over time
    prisma.habit.create({
      data: {
        id: 'habit-meditation',
        userId: user.id,
        name: 'Meditation',
        description: 'Practice mindfulness meditation',
        frequency: Frequency.DAILY,
        habitType: HabitType.DURATION,
        targetValue: 10,
        unit: 'minutes',
        color: '#8b5cf6',
        icon: '🧘',
        category: 'Mindfulness',
        sortOrder: 2,
        isActive: true,
        createdAt: daysAgo(60),
      },
    }),

    // 4. Hydration - High completion
    prisma.habit.create({
      data: {
        id: 'habit-water',
        userId: user.id,
        name: 'Drink Water',
        description: 'Stay hydrated - 8 glasses per day',
        frequency: Frequency.DAILY,
        habitType: HabitType.NUMERIC,
        targetValue: 8,
        unit: 'glasses',
        color: '#3b82f6',
        icon: '💧',
        category: 'Health',
        sortOrder: 3,
        isActive: true,
        createdAt: daysAgo(90),
      },
    }),

    // 5. Journaling - Moderate performer
    prisma.habit.create({
      data: {
        id: 'habit-journal',
        userId: user.id,
        name: 'Daily Journal',
        description: 'Write thoughts and reflections',
        frequency: Frequency.DAILY,
        habitType: HabitType.BOOLEAN,
        color: '#ec4899',
        icon: '✍️',
        category: 'Mindfulness',
        sortOrder: 4,
        isActive: true,
        createdAt: daysAgo(45),
      },
    }),

    // 6. Coding Practice - Weekday focused
    prisma.habit.create({
      data: {
        id: 'habit-coding',
        userId: user.id,
        name: 'Coding Practice',
        description: 'Practice coding or learn new tech',
        frequency: Frequency.DAILY,
        habitType: HabitType.DURATION,
        targetValue: 60,
        unit: 'minutes',
        color: '#0ea5e9',
        icon: '💻',
        category: 'Learning',
        sortOrder: 5,
        isActive: true,
        createdAt: daysAgo(30),
      },
    }),

    // 7. No Social Media - Struggling habit
    prisma.habit.create({
      data: {
        id: 'habit-no-social',
        userId: user.id,
        name: 'No Social Media',
        description: 'Avoid social media until after 6pm',
        frequency: Frequency.DAILY,
        habitType: HabitType.BOOLEAN,
        color: '#ef4444',
        icon: '📵',
        category: 'Productivity',
        sortOrder: 6,
        isActive: true,
        createdAt: daysAgo(21),
      },
    }),

    // 8. Vitamins - Simple boolean, high completion
    prisma.habit.create({
      data: {
        id: 'habit-vitamins',
        userId: user.id,
        name: 'Take Vitamins',
        description: 'Daily vitamins and supplements',
        frequency: Frequency.DAILY,
        habitType: HabitType.BOOLEAN,
        color: '#84cc16',
        icon: '💊',
        category: 'Health',
        sortOrder: 7,
        isActive: true,
        createdAt: daysAgo(75),
      },
    }),

    // ===== WEEKLY HABITS =====

    // 9. Weekly Planning - Sunday
    prisma.habit.create({
      data: {
        id: 'habit-planning',
        userId: user.id,
        name: 'Weekly Planning',
        description: 'Plan the upcoming week',
        frequency: Frequency.WEEKLY,
        habitType: HabitType.BOOLEAN,
        daysOfWeek: [7], // Sunday
        color: '#a855f7',
        icon: '📅',
        category: 'Productivity',
        sortOrder: 8,
        isActive: true,
        createdAt: daysAgo(90),
      },
    }),

    // 10. Gym Sessions - 3x per week
    prisma.habit.create({
      data: {
        id: 'habit-gym',
        userId: user.id,
        name: 'Gym Workout',
        description: 'Strength training session',
        frequency: Frequency.WEEKLY,
        habitType: HabitType.BOOLEAN,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        timesPerWeek: 3,
        color: '#dc2626',
        icon: '🏋️',
        category: 'Fitness',
        sortOrder: 9,
        isActive: true,
        createdAt: daysAgo(60),
      },
    }),

    // 11. Call Family - Weekly on weekends
    prisma.habit.create({
      data: {
        id: 'habit-family',
        userId: user.id,
        name: 'Call Family',
        description: 'Catch up with family members',
        frequency: Frequency.WEEKLY,
        habitType: HabitType.BOOLEAN,
        daysOfWeek: [6, 7], // Sat, Sun
        timesPerWeek: 1,
        color: '#f97316',
        icon: '📞',
        category: 'Social',
        sortOrder: 10,
        isActive: true,
        createdAt: daysAgo(90),
      },
    }),

    // 12. Deep Clean - Weekly
    prisma.habit.create({
      data: {
        id: 'habit-clean',
        userId: user.id,
        name: 'Deep Clean',
        description: 'Deep clean one area of the house',
        frequency: Frequency.WEEKLY,
        habitType: HabitType.BOOLEAN,
        daysOfWeek: [6], // Saturday
        color: '#14b8a6',
        icon: '🧹',
        category: 'Other',
        sortOrder: 11,
        isActive: true,
        createdAt: daysAgo(30),
      },
    }),
  ]);

  console.log(`✅ Created ${habits.length} diverse habits`);

  // ============ CREATE REALISTIC HABIT LOGS (90 DAYS) ============
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs: any[] = [];

  // Helper to check if a date is a weekday
  const isWeekday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
  const getDayOfWeek = (date: Date) => (date.getDay() === 0 ? 7 : date.getDay());

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dayOfWeek = getDayOfWeek(date);

    // ===== DAILY HABITS =====

    // Exercise - 85% overall, better on weekdays, strong current streak
    if (i < 15) {
      // Recent 15 days - 100% for good current streak
      logs.push({
        habitId: 'habit-exercise',
        userId: user.id,
        date,
        completed: true,
        value: 30 + Math.floor(Math.random() * 15),
      });
    } else if (isWeekday(date) ? Math.random() > 0.1 : Math.random() > 0.25) {
      logs.push({
        habitId: 'habit-exercise',
        userId: user.id,
        date,
        completed: true,
        value: 25 + Math.floor(Math.random() * 20),
      });
    }

    // Reading - 75% completion, consistent
    if (Math.random() > 0.25) {
      logs.push({
        habitId: 'habit-reading',
        userId: user.id,
        date,
        completed: true,
        value: 15 + Math.floor(Math.random() * 25),
      });
    }

    // Meditation - Started 60 days ago, improving trend
    if (i < 60) {
      // More likely to complete in recent weeks
      const completionChance = i < 14 ? 0.9 : i < 30 ? 0.75 : 0.55;
      if (Math.random() < completionChance) {
        logs.push({
          habitId: 'habit-meditation',
          userId: user.id,
          date,
          completed: true,
          value: 8 + Math.floor(Math.random() * 12),
        });
      }
    }

    // Water - 90% completion, very consistent
    if (Math.random() > 0.1) {
      logs.push({
        habitId: 'habit-water',
        userId: user.id,
        date,
        completed: true,
        value: 6 + Math.floor(Math.random() * 5),
      });
    }

    // Journal - Started 45 days ago, 65% completion
    if (i < 45 && Math.random() > 0.35) {
      logs.push({
        habitId: 'habit-journal',
        userId: user.id,
        date,
        completed: true,
      });
    }

    // Coding - Started 30 days ago, better on weekdays
    if (i < 30) {
      const chance = isWeekday(date) ? 0.8 : 0.4;
      if (Math.random() < chance) {
        logs.push({
          habitId: 'habit-coding',
          userId: user.id,
          date,
          completed: true,
          value: 45 + Math.floor(Math.random() * 45),
        });
      }
    }

    // No Social Media - Started 21 days ago, struggling (45% success)
    if (i < 21 && Math.random() > 0.55) {
      logs.push({
        habitId: 'habit-no-social',
        userId: user.id,
        date,
        completed: true,
      });
    }

    // Vitamins - Started 75 days ago, 92% completion
    if (i < 75 && Math.random() > 0.08) {
      logs.push({
        habitId: 'habit-vitamins',
        userId: user.id,
        date,
        completed: true,
      });
    }

    // ===== WEEKLY HABITS =====

    // Weekly Planning - Sundays, 85% completion
    if (dayOfWeek === 7 && Math.random() > 0.15) {
      logs.push({
        habitId: 'habit-planning',
        userId: user.id,
        date,
        completed: true,
      });
    }

    // Gym - Mon/Wed/Fri, started 60 days ago, 75% per scheduled day
    if (i < 60 && [1, 3, 5].includes(dayOfWeek) && Math.random() > 0.25) {
      logs.push({
        habitId: 'habit-gym',
        userId: user.id,
        date,
        completed: true,
      });
    }

    // Call Family - Weekends, 80% completion
    if ([6, 7].includes(dayOfWeek) && Math.random() > 0.2) {
      logs.push({
        habitId: 'habit-family',
        userId: user.id,
        date,
        completed: true,
      });
    }

    // Deep Clean - Saturdays, started 30 days ago, 70% completion
    if (i < 30 && dayOfWeek === 6 && Math.random() > 0.3) {
      logs.push({
        habitId: 'habit-clean',
        userId: user.id,
        date,
        completed: true,
      });
    }
  }

  // Batch insert logs
  for (const log of logs) {
    await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: log.habitId,
          date: log.date,
        },
      },
      update: log,
      create: log,
    });
  }

  console.log(`✅ Created ${logs.length} habit logs over 90 days`);

  // ============ UPDATE STREAK COUNTS ============
  await updateStreaks();

  // ============ CREATE MILESTONES ============
  await createMilestones(user.id);

  // ============ SEED BOOKS ============
  await seedBooks(user.id);

  // ============ SEED CHALLENGES ============
  await seedChallenges(user.id, habits);

  console.log('🎉 Seeding completed successfully!');
}

// ============ CREATE MILESTONES ============
async function createMilestones(userId: string) {
  const milestones = [
    // Exercise milestones
    { habitId: 'habit-exercise', type: MilestoneType.STREAK, value: 7, daysAgo: 80 },
    { habitId: 'habit-exercise', type: MilestoneType.STREAK, value: 14, daysAgo: 70 },
    { habitId: 'habit-exercise', type: MilestoneType.STREAK, value: 30, daysAgo: 45 },

    // Water milestones
    { habitId: 'habit-water', type: MilestoneType.STREAK, value: 7, daysAgo: 82 },
    { habitId: 'habit-water', type: MilestoneType.STREAK, value: 30, daysAgo: 55 },

    // Vitamins milestones
    { habitId: 'habit-vitamins', type: MilestoneType.STREAK, value: 7, daysAgo: 65 },
    { habitId: 'habit-vitamins', type: MilestoneType.STREAK, value: 30, daysAgo: 40 },

    // Reading milestones
    { habitId: 'habit-reading', type: MilestoneType.STREAK, value: 7, daysAgo: 75 },
    { habitId: 'habit-reading', type: MilestoneType.STREAK, value: 14, daysAgo: 60 },
  ];

  const now = new Date();
  for (const m of milestones) {
    const achievedAt = new Date(now);
    achievedAt.setDate(achievedAt.getDate() - m.daysAgo);

    await prisma.milestone.upsert({
      where: {
        habitId_type_value: {
          habitId: m.habitId,
          type: m.type,
          value: m.value,
        },
      },
      update: {},
      create: {
        habitId: m.habitId,
        userId,
        type: m.type,
        value: m.value,
        achievedAt,
      },
    });
  }

  console.log(`✅ Created ${milestones.length} milestones`);
}

// ============ SEED TEMPLATES ============
async function seedTemplates() {
  const templates = [
    // Health
    {
      id: 'tpl-exercise',
      name: 'Exercise',
      description: 'Daily physical exercise to stay fit',
      category: 'Health',
      icon: '🏃',
      color: '#10B981',
      habitType: HabitType.BOOLEAN,
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    {
      id: 'tpl-water',
      name: 'Drink Water',
      description: 'Stay hydrated throughout the day',
      category: 'Health',
      icon: '💧',
      color: '#3B82F6',
      habitType: HabitType.NUMERIC,
      targetValue: 8,
      unit: 'glasses',
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    {
      id: 'tpl-sleep',
      name: 'Sleep 8 Hours',
      description: 'Get enough quality sleep',
      category: 'Health',
      icon: '😴',
      color: '#6366F1',
      habitType: HabitType.DURATION,
      targetValue: 480,
      unit: 'minutes',
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    {
      id: 'tpl-vitamins',
      name: 'Take Vitamins',
      description: 'Daily vitamins and supplements',
      category: 'Health',
      icon: '💊',
      color: '#F59E0B',
      habitType: HabitType.BOOLEAN,
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    // Fitness
    {
      id: 'tpl-gym',
      name: 'Go to Gym',
      description: 'Workout at the gym',
      category: 'Fitness',
      icon: '🏋️',
      color: '#EF4444',
      habitType: HabitType.BOOLEAN,
      frequency: Frequency.WEEKLY,
      isSystem: true,
    },
    {
      id: 'tpl-steps',
      name: 'Walk 10,000 Steps',
      description: 'Hit your daily step goal',
      category: 'Fitness',
      icon: '👟',
      color: '#14B8A6',
      habitType: HabitType.NUMERIC,
      targetValue: 10000,
      unit: 'steps',
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    // Productivity
    {
      id: 'tpl-focus',
      name: 'Deep Work Session',
      description: 'Focused work without distractions',
      category: 'Productivity',
      icon: '🎯',
      color: '#8B5CF6',
      habitType: HabitType.DURATION,
      targetValue: 120,
      unit: 'minutes',
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    {
      id: 'tpl-planning',
      name: 'Plan Tomorrow',
      description: 'Plan tasks for the next day',
      category: 'Productivity',
      icon: '📋',
      color: '#0EA5E9',
      habitType: HabitType.BOOLEAN,
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    // Learning
    {
      id: 'tpl-reading',
      name: 'Read',
      description: 'Daily reading habit',
      category: 'Learning',
      icon: '📚',
      color: '#A855F7',
      habitType: HabitType.DURATION,
      targetValue: 30,
      unit: 'minutes',
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    {
      id: 'tpl-coding',
      name: 'Code Practice',
      description: 'Practice coding skills',
      category: 'Learning',
      icon: '💻',
      color: '#1E40AF',
      habitType: HabitType.DURATION,
      targetValue: 60,
      unit: 'minutes',
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    // Mindfulness
    {
      id: 'tpl-meditation',
      name: 'Meditate',
      description: 'Daily meditation practice',
      category: 'Mindfulness',
      icon: '🧘‍♂️',
      color: '#7C3AED',
      habitType: HabitType.DURATION,
      targetValue: 10,
      unit: 'minutes',
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    {
      id: 'tpl-journal',
      name: 'Journal',
      description: 'Write in your journal',
      category: 'Mindfulness',
      icon: '✍️',
      color: '#DB2777',
      habitType: HabitType.BOOLEAN,
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    {
      id: 'tpl-gratitude',
      name: 'Gratitude',
      description: 'Write 3 things you are grateful for',
      category: 'Mindfulness',
      icon: '🙏',
      color: '#F97316',
      habitType: HabitType.BOOLEAN,
      frequency: Frequency.DAILY,
      isSystem: true,
    },
    // Finance
    {
      id: 'tpl-no-spend',
      name: 'No Spend Day',
      description: 'Avoid unnecessary spending',
      category: 'Finance',
      icon: '💰',
      color: '#16A34A',
      habitType: HabitType.BOOLEAN,
      frequency: Frequency.DAILY,
      isSystem: true,
    },
  ];

  for (const template of templates) {
    await prisma.habitTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }

  console.log(`✅ Seeded ${templates.length} habit templates`);
}

// ============ UPDATE STREAKS ============
async function updateStreaks() {
  const habits = await prisma.habit.findMany({
    include: {
      habitLogs: {
        orderBy: { date: 'desc' },
      },
    },
  });

  for (const habit of habits) {
    const logs = habit.habitLogs.filter((l) => l.completed);
    const totalCompletions = logs.length;

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = logs.map((l) => new Date(l.date).getTime()).sort((a, b) => b - a);

    // Current streak (from today backwards)
    let checkDate = today.getTime();
    for (const logDate of sortedDates) {
      const daysDiff = Math.round((checkDate - logDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        currentStreak++;
        checkDate = logDate;
      } else {
        break;
      }
    }

    // Longest streak
    const uniqueDates = Array.from(new Set(sortedDates)).sort((a, b) => a - b);
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = Math.round((uniqueDates[i] - uniqueDates[i - 1]) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    const lastCompletedAt = logs.length > 0 ? logs[0].date : null;

    await prisma.habit.update({
      where: { id: habit.id },
      data: {
        currentStreak,
        longestStreak,
        totalCompletions,
        lastCompletedAt,
      },
    });
  }

  console.log('✅ Updated streak counts');
}

// ============ SEED BOOKS ============
async function seedBooks(userId: string) {
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const books = await Promise.all([
    // Currently reading
    prisma.book.create({
      data: {
        id: 'book-atomic-habits',
        userId,
        title: 'Atomic Habits',
        author: 'James Clear',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg',
        totalPages: 320,
        currentPage: 185,
        status: BookStatus.READING,
        notes: 'Great insights on habit formation. The 1% improvement concept is powerful.',
        startedAt: daysAgo(14),
        createdAt: daysAgo(20),
      },
    }),

    // Finished books
    prisma.book.create({
      data: {
        id: 'book-deep-work',
        userId,
        title: 'Deep Work',
        author: 'Cal Newport',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1447957962i/25744928.jpg',
        totalPages: 296,
        currentPage: 296,
        status: BookStatus.FINISHED,
        rating: 5,
        notes: 'Changed how I think about focused work. Implemented time blocking immediately.',
        startedAt: daysAgo(45),
        finishedAt: daysAgo(30),
        createdAt: daysAgo(50),
      },
    }),

    prisma.book.create({
      data: {
        id: 'book-thinking-fast-slow',
        userId,
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1317793965i/11468377.jpg',
        totalPages: 499,
        currentPage: 499,
        status: BookStatus.FINISHED,
        rating: 4,
        notes: 'Dense but rewarding. System 1 vs System 2 framework is useful.',
        startedAt: daysAgo(90),
        finishedAt: daysAgo(60),
        createdAt: daysAgo(95),
      },
    }),

    prisma.book.create({
      data: {
        id: 'book-power-of-habit',
        userId,
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1545854312i/12609433.jpg',
        totalPages: 371,
        currentPage: 371,
        status: BookStatus.FINISHED,
        rating: 4,
        notes: 'The habit loop (cue-routine-reward) is fundamental. Great case studies.',
        startedAt: daysAgo(120),
        finishedAt: daysAgo(100),
        createdAt: daysAgo(125),
      },
    }),

    // Want to read
    prisma.book.create({
      data: {
        id: 'book-why-we-sleep',
        userId,
        title: 'Why We Sleep',
        author: 'Matthew Walker',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1556604137i/34466963.jpg',
        totalPages: 368,
        currentPage: 0,
        status: BookStatus.WANT_TO_READ,
        notes: 'Recommended by multiple podcasts. Want to improve sleep habits.',
        createdAt: daysAgo(10),
      },
    }),

    prisma.book.create({
      data: {
        id: 'book-essentialism',
        userId,
        title: 'Essentialism',
        author: 'Greg McKeown',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1403165375i/18077875.jpg',
        totalPages: 260,
        currentPage: 0,
        status: BookStatus.WANT_TO_READ,
        createdAt: daysAgo(5),
      },
    }),

    prisma.book.create({
      data: {
        id: 'book-mans-search',
        userId,
        title: "Man's Search for Meaning",
        author: 'Viktor E. Frankl',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535419394i/4069.jpg',
        totalPages: 165,
        currentPage: 0,
        status: BookStatus.WANT_TO_READ,
        createdAt: daysAgo(3),
      },
    }),

    // Abandoned
    prisma.book.create({
      data: {
        id: 'book-godel',
        userId,
        title: 'Gödel, Escher, Bach',
        author: 'Douglas Hofstadter',
        coverUrl:
          'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1547125681i/24113.jpg',
        totalPages: 777,
        currentPage: 120,
        status: BookStatus.ABANDONED,
        notes: 'Too dense for now. Will revisit when I have more time.',
        startedAt: daysAgo(60),
        createdAt: daysAgo(65),
      },
    }),
  ]);

  console.log(`✅ Created ${books.length} books`);

  // Add reading logs for currently reading book
  const readingLogs = [];
  let currentPage = 0;
  for (let i = 14; i >= 0; i--) {
    if (Math.random() > 0.3) {
      // 70% chance of reading each day
      const pagesRead = Math.floor(Math.random() * 20) + 10; // 10-30 pages
      currentPage = Math.min(currentPage + pagesRead, 185);
      readingLogs.push({
        bookId: 'book-atomic-habits',
        date: daysAgo(i),
        pagesRead,
      });
    }
  }

  for (const log of readingLogs) {
    await prisma.readingLog.upsert({
      where: {
        bookId_date: {
          bookId: log.bookId,
          date: log.date,
        },
      },
      update: log,
      create: log,
    });
  }

  console.log(`✅ Created ${readingLogs.length} reading logs`);
}

// ============ SEED CHALLENGES ============
type HabitArray = Awaited<ReturnType<typeof prisma.habit.create>>[];

async function seedChallenges(userId: string, habits: HabitArray) {
  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Get habit IDs
  const exerciseHabit = habits.find((h) => h.id === 'habit-exercise');
  const meditationHabit = habits.find((h) => h.id === 'habit-meditation');
  const readingHabit = habits.find((h) => h.id === 'habit-reading');
  const waterHabit = habits.find((h) => h.id === 'habit-water');
  const sleepHabit = habits.find((h) => h.id === 'habit-sleep');

  const challenges = await Promise.all([
    // Active challenge - 30-day morning routine
    prisma.challenge.create({
      data: {
        id: 'challenge-morning-routine',
        userId,
        name: '30-Day Morning Routine',
        description:
          'Build a powerful morning routine with exercise and meditation every day for 30 days.',
        duration: 30,
        startDate: daysAgo(12),
        endDate: daysFromNow(18),
        status: ChallengeStatus.ACTIVE,
        createdAt: daysAgo(15),
      },
    }),

    // Active challenge - Wellness week
    prisma.challenge.create({
      data: {
        id: 'challenge-wellness-week',
        userId,
        name: '7-Day Wellness Reset',
        description:
          'A week-long wellness challenge focusing on hydration, sleep, and mindfulness.',
        duration: 7,
        startDate: daysAgo(3),
        endDate: daysFromNow(4),
        status: ChallengeStatus.ACTIVE,
        createdAt: daysAgo(5),
      },
    }),

    // Completed challenge
    prisma.challenge.create({
      data: {
        id: 'challenge-reading-sprint',
        userId,
        name: '14-Day Reading Sprint',
        description: 'Read every single day for 2 weeks to build a solid reading habit.',
        duration: 14,
        startDate: daysAgo(45),
        endDate: daysAgo(31),
        status: ChallengeStatus.COMPLETED,
        completionRate: 92.86,
        createdAt: daysAgo(50),
      },
    }),

    // Failed challenge
    prisma.challenge.create({
      data: {
        id: 'challenge-no-screens',
        userId,
        name: '21-Day Digital Detox',
        description: 'Reduce screen time and increase meditation practice.',
        duration: 21,
        startDate: daysAgo(80),
        endDate: daysAgo(59),
        status: ChallengeStatus.FAILED,
        completionRate: 45.24,
        createdAt: daysAgo(85),
      },
    }),
  ]);

  console.log(`✅ Created ${challenges.length} challenges`);

  // Link habits to challenges
  const challengeHabits = [];

  // Morning routine challenge: exercise + meditation
  if (exerciseHabit) {
    challengeHabits.push({
      challengeId: 'challenge-morning-routine',
      habitId: exerciseHabit.id,
    });
  }
  if (meditationHabit) {
    challengeHabits.push({
      challengeId: 'challenge-morning-routine',
      habitId: meditationHabit.id,
    });
  }

  // Wellness week: water + sleep + meditation
  if (waterHabit) {
    challengeHabits.push({
      challengeId: 'challenge-wellness-week',
      habitId: waterHabit.id,
    });
  }
  if (sleepHabit) {
    challengeHabits.push({
      challengeId: 'challenge-wellness-week',
      habitId: sleepHabit.id,
    });
  }
  if (meditationHabit) {
    challengeHabits.push({
      challengeId: 'challenge-wellness-week',
      habitId: meditationHabit.id,
    });
  }

  // Reading sprint
  if (readingHabit) {
    challengeHabits.push({
      challengeId: 'challenge-reading-sprint',
      habitId: readingHabit.id,
    });
  }

  // Digital detox: meditation
  if (meditationHabit) {
    challengeHabits.push({
      challengeId: 'challenge-no-screens',
      habitId: meditationHabit.id,
    });
  }

  for (const ch of challengeHabits) {
    await prisma.challengeHabit.create({ data: ch });
  }

  console.log(`✅ Linked ${challengeHabits.length} habits to challenges`);

  // Create progress for active challenges
  const progressEntries = [];

  // Morning routine progress (12 days so far)
  for (let i = 12; i >= 0; i--) {
    const completed = Math.random() > 0.15 ? 2 : Math.random() > 0.5 ? 1 : 0;
    progressEntries.push({
      challengeId: 'challenge-morning-routine',
      userId,
      date: daysAgo(i),
      habitsCompleted: completed,
      habitsTotal: 2,
    });
  }

  // Wellness week progress (3 days so far)
  for (let i = 3; i >= 0; i--) {
    const completed = Math.random() > 0.2 ? 3 : Math.random() > 0.5 ? 2 : 1;
    progressEntries.push({
      challengeId: 'challenge-wellness-week',
      userId,
      date: daysAgo(i),
      habitsCompleted: completed,
      habitsTotal: 3,
    });
  }

  for (const progress of progressEntries) {
    await prisma.challengeProgress.upsert({
      where: {
        challengeId_date: {
          challengeId: progress.challengeId,
          date: progress.date,
        },
      },
      update: progress,
      create: progress,
    });
  }

  console.log(`✅ Created ${progressEntries.length} challenge progress entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
