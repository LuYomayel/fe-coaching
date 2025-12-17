import { IUser } from 'types/models';
export interface IRpeMethod {
  id: number;
  name: string;
  minValue: number;
  maxValue: number;
  step: number;
  valuesMeta?: Array<{ value: number; color: string; emoji?: string }>;
  createdBy: IUser;
  createdAt: Date;
  isDefault: boolean;
}
