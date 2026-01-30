import { PrismaClient, Frequency, HabitType, MilestoneType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data for fresh seed
  await prisma.habitLog.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.habit.deleteMany({});
  console.log('🧹 Cleaned up existing habit data');

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

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
