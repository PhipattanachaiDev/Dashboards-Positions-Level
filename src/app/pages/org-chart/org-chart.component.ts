import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule, CdkDragStart, CdkDragEnd } from '@angular/cdk/drag-drop';
import { Level, PositionItem } from '../../models/org-data.model';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DataService } from '../../services/data.services';

interface Connector {
  d: string;
  from: string;
  to: string;
  color?: string;
}

interface TempNodeState {
  name?: string;
  nameTh?: string;
  nameCh?: string;
  nameVi?: string;
  section?: string;
  salaryType?: 'Normal' | 'Commission';
}


@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, NzIconModule],
  templateUrl: './org-chart.component.html',
  styleUrls: ['./org-chart.component.css']
})
export class OrgChartComponent implements AfterViewInit {
  @ViewChild('chartContainer') chartRef!: ElementRef;

  // Data initialization
  levels: Level[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Level ${i + 1}`, items: [] }));

  poolPositions: PositionItem[] = [
    { id: 'p1', name: 'Programmer' },
    { id: 'p2', name: 'IT Support' },
    { id: 'p3', name: 'HR Officer' },
    { id: 'p4', name: 'Manager' }
  ];

  // SVG & Visual settings
  connectors: Connector[] = [];
  svgWidth = 0;
  svgHeight = 0;

  colorMap: Record<string, string> = {};
  colors = ['blue', 'red', 'green', 'orange', 'purple'];
  highlightedIds = new Set<string>();

  // State for Modals and temporary data
  modals = { create: false, parent: false, delete: false, error: false };
  errorMessage = '';

  tempNode: TempNodeState = {
    salaryType: 'Normal',
    section: '',
    nameTh: '',
    nameCh: '',
    nameVi: ''
  };
  permissionsList = ['Approve Leave', 'View Leave', 'Approve Expense', 'View Expense'];

  dragContext: any = null;
  deleteContext: any = null;
  draggedItemId: string | null = null; // Track dragged item to hide lines

  private drawingFrameId: number | null = null; // For throttling drawLines

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dataService: DataService
  ) { }

  ngAfterViewInit() {
    // Draw lines once the view is rendered
    setTimeout(() => this.drawLines(), 100);
  }

  @HostListener('window:resize')
  onResize() {
    this.drawLines();
  }

  // --- Helpers & List Management ---

  get dropListIds(): string[] {
    return ['sidebar-list', ...this.levels.map((_, i) => `cdk-drop-list-${i}`)];
  }

  removePositionFromPool(index: number) {
    this.poolPositions.splice(index, 1);
  }

  removeLevel(index: number) {
    const levelToRemove = this.levels[index];

    if (levelToRemove.items.length > 0) {
      this.errorMessage = `Cannot delete ${levelToRemove.name}!\nPlease remove all positions from this level first.`;
      this.modals.error = true;
      return;
    }

    this.levels.splice(index, 1);
    this.updateLevelNames();
    setTimeout(() => this.drawLines(), 50);
  }

  updateLevelNames() {
    this.levels.forEach((lvl, idx) => {
      lvl.name = `Level ${idx + 1}`;
    });
  }

  // --- Chart Logic (Sorting & Drawing) ---

  sortNodesByParent() {
    for (let i = 1; i < this.levels.length; i++) {
      const currentLevel = this.levels[i];
      const parentLevel = this.levels[i - 1];

      const parentOrder = new Map<string, number>();
      parentLevel.items.forEach((node, index) => {
        parentOrder.set(node.id, index);
      });

      currentLevel.items.sort((a, b) => {
        const pIdA = a.parentId || '';
        const pIdB = b.parentId || '';
        const indexA = parentOrder.get(pIdA) ?? 9999;
        const indexB = parentOrder.get(pIdB) ?? 9999;

        if (indexA === indexB) return 0;
        return indexA - indexB;
      });
    }
  }

  // Optimized Draw Lines using requestAnimationFrame
  drawLines() {
    if (this.drawingFrameId) {
      cancelAnimationFrame(this.drawingFrameId);
    }

    this.drawingFrameId = requestAnimationFrame(() => {
      this.executeDrawLines();
      this.drawingFrameId = null;
    });
  }

  private executeDrawLines() {
    this.sortNodesByParent();

    if (!this.chartRef) return;

    const containerEl = this.chartRef.nativeElement;
    const containerRect = containerEl.getBoundingClientRect();

    this.svgWidth = containerEl.scrollWidth;
    this.svgHeight = containerEl.scrollHeight;

    const newLines: Connector[] = [];

    // Assign colors
    this.colorMap = {};
    let colorIdx = 0;
    this.levels.forEach(lvl => {
      lvl.items.forEach(node => {
        if (!this.colorMap[node.id]) {
          this.colorMap[node.id] = this.colors[colorIdx++ % this.colors.length];
        }
      });
    });

    // Generate Path (d)
    this.levels.forEach((lvl, lvlIndex) => {
      lvl.items.forEach(child => {
        if (!child.parentId) return;

        const childEl = document.getElementById(`node-${child.id}`);
        const parentEl = document.getElementById(`node-${child.parentId}`);

        if (childEl && parentEl) {
          const cRect = childEl.getBoundingClientRect();
          const pRect = parentEl.getBoundingClientRect();

          const start = {
            x: (pRect.left + pRect.width / 2) - containerRect.left + containerEl.scrollLeft,
            y: pRect.bottom - containerRect.top + containerEl.scrollTop
          };

          const end = {
            x: (cRect.left + cRect.width / 2) - containerRect.left + containerEl.scrollLeft,
            y: cRect.top - containerRect.top + containerEl.scrollTop
          };

          // Curve logic
          const prevLevel = this.levels[lvlIndex - 1];
          let parentIndex = 0;
          let totalParents = 1;

          if (prevLevel) {
            parentIndex = prevLevel.items.findIndex(p => p.id === child.parentId);
            totalParents = prevLevel.items.length;
            if (parentIndex === -1) parentIndex = 0;
          }

          const stepSize = 15;
          const basePath = 20;
          const depthIndex = totalParents - 1 - parentIndex;
          const midY = start.y + basePath + (depthIndex * stepSize);
          const r = 50;
          let d = '';

          if (Math.abs(start.x - end.x) < 15) {
            d = `M ${start.x},${start.y} V ${end.y}`;
          } else {
            d += `M ${start.x},${start.y} V ${midY - r}`;
            const dir = start.x < end.x ? 1 : -1;
            d += ` Q ${start.x},${midY} ${start.x + (r * dir)},${midY}`;
            d += ` H ${end.x - (r * dir)}`;
            d += ` Q ${end.x},${midY} ${end.x},${midY + r}`;
            d += ` V ${end.y}`;
          }

          newLines.push({
            d: d,
            from: child.parentId!,
            to: child.id,
            color: this.colorMap[child.id]
          });
        }
      });
    });

    this.connectors = newLines;
    this.cdr.detectChanges();
  }

  // --- Drag & Drop Handlers ---

  onDragStart(event: CdkDragStart<any>) {
    this.draggedItemId = event.source.data.id;
  }

  onDrop(event: CdkDragDrop<PositionItem[]>, levelIndex: number) {
    this.draggedItemId = null; // Clear dragged state

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.drawLines();
      return;
    }

    const item = event.previousContainer.data[event.previousIndex];

    // Level 1 needs no parent
    if (levelIndex === 0) {
      this.transferNode(event, undefined, []);
      return;
    }

    const prevLevel = this.levels[levelIndex - 1];

    if (prevLevel.items.length === 0) {
      this.errorMessage = `No parent node available in Level ${levelIndex}`;
      this.modals.error = true;
      return;
    }

    // Context for Modal
    this.dragContext = {
      event,
      item,
      targetLevel: levelIndex + 1,
      potentialParents: prevLevel.items,
      selectedParentId: prevLevel.items[0].id,
      perms: {}
    };
    this.modals.parent = true;
  }

  confirmDrop() {
    if (!this.dragContext) return;

    const { event, selectedParentId, perms } = this.dragContext;
    const activePerms = Object.keys(perms).filter(k => perms[k]);

    this.transferNode(event, selectedParentId, activePerms);
    this.closeParentModal();
  }

  private transferNode(event: any, parentId: string | undefined, perms: string[]) {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    const movedNode = event.container.data[event.currentIndex];
    movedNode.parentId = parentId;
    movedNode.permissions = perms;

    setTimeout(() => this.drawLines(), 50);
  }

  onDropToSidebar(event: CdkDragDrop<PositionItem[]>) {
    this.draggedItemId = null;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      const item = event.container.data[event.currentIndex];
      delete item.parentId;
      delete item.permissions;
    }
    this.drawLines();
  }

  // --- Modals & CRUD ---

  toggleModal(type: 'create' | 'parent', state = true) {
    if (type === 'create') {
      this.tempNode = { salaryType: 'Normal', section: '' };
      this.modals.create = state;
    }
  }

  closeParentModal() {
    this.modals.parent = false;
    this.dragContext = null;
  }

  createNode() {
    if (!this.tempNode.name) return;

    const newNode: PositionItem = {
      id: `new_${Date.now()}`,
      name: this.tempNode.name,
      nameTh: this.tempNode.nameTh,
      nameZh: this.tempNode.nameCh,
      nameVi: this.tempNode.nameVi,
      section: this.tempNode.section,
      salaryType: this.tempNode.salaryType || 'Normal'
    } as PositionItem;

    this.poolPositions.push(newNode);
    this.toggleModal('create', false);
  }

  requestDelete(node: PositionItem, levelIdx: number) {
    const descendants = this.findDescendants(node.id);
    this.deleteContext = {
      node,
      levelIdx,
      count: descendants.length,
      descendants
    };
    this.modals.delete = true;
  }

  executeDelete() {
    if (!this.deleteContext) return;

    const { node, levelIdx, descendants } = this.deleteContext;

    const lvl = this.levels[levelIdx];
    lvl.items = lvl.items.filter(n => n.id !== node.id);
    this.resetAndPushToPool(node);

    descendants.forEach((d: PositionItem) => {
      this.levels.forEach(l => {
        l.items = l.items.filter(i => i.id !== d.id);
      });
      this.resetAndPushToPool(d);
    });

    this.modals.delete = false;
    setTimeout(() => this.drawLines(), 50);
  }

  private resetAndPushToPool(node: PositionItem) {
    delete node.parentId;
    delete node.permissions;
    this.poolPositions.push(node);
  }

  private findDescendants(parentId: string): PositionItem[] {
    let list: PositionItem[] = [];
    this.levels.forEach(l => {
      const children = l.items.filter(i => i.parentId === parentId);
      children.forEach(c => {
        list.push(c);
        list = [...list, ...this.findDescendants(c.id)];
      });
    });
    return list;
  }

  // --- Visual Helpers ---

  getBorderClass(parentId?: string) {
    return parentId && this.colorMap[parentId] ? `border-${this.colorMap[parentId]}` : '';
  }

  getColorClass(nodeId: string) {
    return this.colorMap[nodeId] ? `line-${this.colorMap[nodeId]}` : '';
  }

  getMarkerUrl(nodeId: string): string {
    const colorName = this.colorMap[nodeId];
    if (colorName) {
      return `url(#arrow-${colorName})`;
    }
    return '';
  }

  setHighlight(node: PositionItem) {
    this.highlightedIds.clear();
    this.highlightedIds.add(node.id);
    if (node.parentId) this.highlightedIds.add(node.parentId);
    this.levels.forEach(l => l.items.forEach(i => {
      if (i.parentId === node.id) this.highlightedIds.add(i.id);
    }));
  }

  isHovered(pId: string, cId: string) {
    return this.highlightedIds.has(pId) && this.highlightedIds.has(cId);
  }

  addLevel() {
    const nextId = this.levels.length + 1;
    this.levels.push({
      id: nextId,
      name: `Level ${nextId}`,
      items: []
    });

    setTimeout(() => {
      if (this.chartRef) {
        this.chartRef.nativeElement.scrollTop = this.chartRef.nativeElement.scrollHeight;
      }
    }, 100);
  }

  saveAll() {
    const allNodes: any[] = [];
    const containerEl = this.chartRef?.nativeElement;

    if (containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      this.levels.forEach(lvl => {
        lvl.items.forEach(node => {
          const nodeEl = document.getElementById(`node-${node.id}`);
          let x = 0;
          let y = 0;
          if (nodeEl) {
            const rect = nodeEl.getBoundingClientRect();
            x = rect.left - containerRect.left + containerEl.scrollLeft;
            y = rect.top - containerRect.top + containerEl.scrollTop;
          }
          allNodes.push({ ...node, x, y });
        });
      });
    }

    this.dataService.changeData(
      'Saved Organization Chart',
      `Saved structure with ${allNodes.length} positions.`,
      { nodes: allNodes, connections: this.connectors }
    );
  }
}
