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