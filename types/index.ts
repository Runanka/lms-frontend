export type Role = 'student' | 'coach';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role | null;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  coachId: string;
  modules: Module[];
  createdAt: string;
}

export interface Module {
  _id: string;
  title: string;
  order: number;
  resources: Resource[];
  assignmentId?: string;
}

export interface Resource {
  _id: string;
  type: 'video' | 'document';
  title: string;
  youtubeUrl?: string;
  content?: string;
}

export interface Path {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  createdBy: string;
  courses: Course[];
  createdAt: string;
}

export interface Progress {
  _id: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  completedVideos: string[];
  completedDocuments: string[];
  progress: number;
}

export interface Assignment {
  _id: string;
  title: string;
  type: 'mcq' | 'subjective';
  courseId: string;
  mcqQuestions?: MCQQuestion[];
  subjectiveQuestions?: SubjectiveQuestion[];
}

export interface MCQQuestion {
  _id: string;
  questionText: string;
  options: { text: string; isCorrect?: boolean }[];
}

export interface SubjectiveQuestion {
  _id: string;
  questionText: string;
  maxWords?: number;
}

export interface Comment {
  _id: string;
  courseId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  content: string;
  createdAt: string;
}