import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserSettings {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
    calendarSync: {
        enabled: boolean;
        homework: boolean;
        schedule: boolean;
        comunications: boolean;
        exams: boolean;
    };
}

interface UserData {
  name: string;
  settings: UserSettings;
  classes: ClassData[];
}

interface ClassData {
    name: string;
    teachers: string[];
    students: string[];
    schedule: { [day: string]: string[] };
    subjects: SubjectData[];
    notes: string[];
}

interface SubjectData {
    id: string;
    name: string;
    teacher: string;
    schedule: { [day: string]: string[] };
    maxgrade: number;
    grades: GradeData[];
    homework: HomeworkData[];
}

interface GradeData {
    title: string;
    type: string;
    grade: number;
}

interface HomeworkData {
    id: string;
    title: string;
    description: string;
    subject: string;
    dueDate: string;
    status: 'pending' | 'completed';
}

const saveData = async (key: string, value: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Save error:', error);
  }
};

const loadData = async () => {
    try {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) return JSON.parse(stored);
    } catch (error) {
        console.error('Load error:', error);
    }
};
loadData();

// Usage