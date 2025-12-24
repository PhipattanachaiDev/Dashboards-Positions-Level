import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DashboardItem, DataService } from '../../services/data.services';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboards.component.html',
  styleUrls: ['./dashboards.component.css'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-20px)' }),
          stagger(100, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardsComponent implements OnInit {
  logs: DashboardItem[] = [];
  selectedLog: DashboardItem | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.currentData.subscribe(data => {
      this.logs = data;
    });
  }

  openDetail(item: DashboardItem) {
    this.selectedLog = item;
  }

  closeDetail() {
    this.selectedLog = null;
  }

  // เพิ่มฟังก์ชันสำหรับวาดเส้นใน Popup
  getPath(conn: any): string {
    if (!this.selectedLog?.graphData) return '';

    const nodes = this.selectedLog.graphData.nodes;
    const fromNode = nodes.find((n: any) => n.id === conn.from);
    const toNode = nodes.find((n: any) => n.id === conn.to);

    if (!fromNode || !toNode) return '';

    const x1 = (fromNode.x || fromNode.left) + 100;
    const y1 = (fromNode.y || fromNode.top) + 40;
    const x2 = (toNode.x || toNode.left) + 100;
    const y2 = (toNode.y || toNode.top);

    return `M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`;
  }
}
