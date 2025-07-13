
export enum AppStep {
  Upload = 'UPLOAD',
  Processing = 'PROCESSING',
  DisplayData = 'DISPLAY_DATA',
  Results = 'RESULTS',
}

export interface RawPsqiData {
  id: string;
  timeTaken: string;
  date: string;
  name: string;
  age: string;
  q1: string; // Bed time
  q2: string; // Sleep latency time
  q3:string; // Wake up time
  q4: string; // Actual sleep duration
  q5a: string;
  q5b: string;
  q5c: string;
  q5d: string;
  q5e: string;
  q5f: string;
  q5g: string;
  q5h: string;
  q5i: string;
  q5j: string;
  q6: string; // Subjective sleep quality
  q7: string; // Medication
  q8: string; // Daytime sleepiness
  q9: string; // Daytime enthusiasm
}

export interface PsqiComponentScores {
    c1_sleepQuality: number;
    c2_sleepLatency: number;
    c3_sleepDuration: number;
    c4_sleepEfficiency: number;
    c5_sleepDisturbances: number;
    c6_useOfMedication: number;
    c7_daytimeDysfunction: number;
}

export interface PsqiScoreData {
    id: string;
    name: string;
    age: string;
    scores: PsqiComponentScores;
    totalScore: number;
}
