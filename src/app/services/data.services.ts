import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DashboardItem {
  action: string;
  time: string;
  details: string;
  isNew?: boolean;

  graphData?: { nodes: any[], connections: any[] };
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataSource = new BehaviorSubject<DashboardItem[]>([]);
  currentData = this.dataSource.asObservable();

  changeData(action: string, details: string, graphData?: { nodes: any[], connections: any[] }) {
    const current = this.dataSource.value;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newItem: DashboardItem = {
      action: action,
      details: details,
      time: timeString,
      isNew: true,
      graphData: graphData
    };

    this.dataSource.next([newItem, ...current]);
  }
}
