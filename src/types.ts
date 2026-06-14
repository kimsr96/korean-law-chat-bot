export interface Message {
  id?: string;
  role: "user" | "model";
  content: string;
  createdAt: any; // Firestore Timestamp or Date
}

export interface Session {
  id: string;
  title: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export interface PredefinedPrompt {
  id: string;
  category: string;
  label: string;
  prompt: string;
}
