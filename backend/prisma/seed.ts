import { PrismaClient, Frequency, HabitType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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
      name: 'Test User',
    },
  });

  console.log('✅ Created test user:', user.email);

  // ============ CREATE SAMPLE HABITS ============
  // Set creation date to 60 days ago so historical data makes sense
  const habitCreatedAt = new Date();
  habitCreatedAt.setDate(habitCreatedAt.getDate() - 60);

  const habits = await Promise.all([
    prisma.habit.upsert({
      where: { id: 'habit-exercise' },
      update: { createdAt: habitCreatedAt },
      create: {
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
        category: 'Health',
        sortOrder: 0,
        isActive: true,
        createdAt: habitCreatedAt,
      },
    }),
    prisma.habit.upsert({
      where: { id: 'habit-reading' },
      update: { createdAt: habitCreatedAt },
      create: {
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
        createdAt: habitCreatedAt,
      },
    }),
    prisma.habit.upsert({
      where: { id: 'habit-meditation' },
      update: { createdAt: habitCreatedAt },
      create: {
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
        createdAt: habitCreatedAt,
      },
    }),
    prisma.habit.upsert({
      where: { id: 'habit-water' },
      update: { createdAt: habitCreatedAt },
      create: {
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
        createdAt: habitCreatedAt,
      },
    }),
    prisma.habit.upsert({
      where: { id: 'habit-planning' },
      update: { createdAt: habitCreatedAt },
      create: {
        id: 'habit-planning',
        userId: user.id,
        name: 'Weekly Planning',
        description: 'Plan the upcoming week',
        frequency: Frequency.WEEKLY,
        habitType: HabitType.BOOLEAN,
        daysOfWeek: [7], // Sunday
        color: '#ec4899',
        icon: '📅',
        category: 'Productivity',
        sortOrder: 4,
        isActive: true,
        createdAt: habitCreatedAt,
      },
    }),
  ]);

  console.log(`✅ Created ${habits.length} habits`);

  // ============ CREATE HABIT LOGS (LAST 30 DAYS) ============
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Exercise - 90% completion rate
    if (Math.random() > 0.1) {
      logs.push({
        habitId: 'habit-exercise',
        userId: user.id,
        date,
        completed: true,
        value: 25 + Math.floor(Math.random() * 15), // 25-40 minutes
        notes: i === 0 ? 'Felt great today!' : null,
      });
    }

    // Reading - 80% completion rate
    if (Math.random() > 0.2) {
      logs.push({
        habitId: 'habit-reading',
        userId: user.id,
        date,
        completed: true,
        value: 15 + Math.floor(Math.random() * 20), // 15-35 pages
      });
    }

    // Meditation - 70% completion rate
    if (Math.random() > 0.3) {
      logs.push({
        habitId: 'habit-meditation',
        userId: user.id,
        date,
        completed: true,
        value: 10 + Math.floor(Math.random() * 10), // 10-20 minutes
      });
    }

    // Water - 85% completion rate
    if (Math.random() > 0.15) {
      logs.push({
        habitId: 'habit-water',
        userId: user.id,
        date,
        completed: true,
        value: 6 + Math.floor(Math.random() * 4), // 6-10 glasses
      });
    }
  }

  // Weekly planning - Sundays only
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 && Math.random() > 0.1) {
      // Sunday
      logs.push({
        habitId: 'habit-planning',
        userId: user.id,
        date,
        completed: true,
      });
    }
  }

  // Insert logs (skip existing)
  for (const log of logs) {
    await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: log.habitId,
          date: log.date,
        },
      },
      update: {},
      create: log,
    });
  }

  console.log(`✅ Created ${logs.length} habit logs`);

  // ============ UPDATE STREAK COUNTS ============
  await updateStreaks();

  console.log('🎉 Seeding completed successfully!');
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
    const uniqueDates = [...new Set(sortedDates)].sort((a, b) => a - b);
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
