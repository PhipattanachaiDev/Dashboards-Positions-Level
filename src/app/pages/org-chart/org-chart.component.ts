import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { Level, PositionItem } from '../../models/org-data.model';
import { NzIconModule } from 'ng-zorro-antd/icon';

interface Connector {
  d: string;
  from: string;
  to: string;
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

  // Data & State
  levels: Level[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Level ${i + 1}`, items: [] }));

  poolPositions: PositionItem[] = [
    { id: 'p1', name: 'Programmer' },
    { id: 'p2', name: 'IT Support' },
    { id: 'p3', name: 'HR Officer' },
    { id: 'p4', name: 'Manager' }
  ];

  connectors: Connector[] = [];
  svgWidth = 0;
  svgHeight = 0;

  colorMap: Record<string, string> = {};
  colors = ['blue', 'red', 'green', 'orange', 'purple'];
  highlightedIds = new Set<string>();

  modals = { create: false, parent: false, delete: false, error: false };
  errorMessage = '';

  tempNode: any = {};
  permissionsList = ['Approve Leave', 'View Leave', 'Approve Expense', 'View Expense'];

  dragContext: any = null;
  deleteContext: any = null;

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    setTimeout(() => this.drawLines(), 100);
  }

  @HostListener('window:resize')
  onResize() {
    this.drawLines();
  }

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

        if (indexA === indexB) {
          return 0;
        }

        return indexA - indexB;
      });
    }
  }

  drawLines() {
    this.sortNodesByParent();

    this.cdr.detectChanges();

    if (!this.chartRef) return;

    const containerEl = this.chartRef.nativeElement;
    const containerRect = containerEl.getBoundingClientRect();

    this.svgWidth = containerEl.scrollWidth;
    this.svgHeight = containerEl.scrollHeight;

    const newLines: any[] = [];

    this.colorMap = {};
    let colorIdx = 0;
    this.levels.forEach(lvl => {
      lvl.items.forEach(node => {
        if (!this.colorMap[node.id]) {
          this.colorMap[node.id] = this.colors[colorIdx++ % this.colors.length];
        }
      });
    });

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


  onDrop(event: CdkDragDrop<PositionItem[]>, levelIndex: number) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.drawLines();
      return;
    }

    const item = event.previousContainer.data[event.previousIndex];

    // Case 1: Drop to Level 1 (Root) -> No Parent needed
    if (levelIndex === 0) {
      this.transferNode(event, undefined, []);
      return;
    }

    // Case 2: Drop to Level > 1 -> Check Parent availability
    const prevLevel = this.levels[levelIndex - 1];

    if (prevLevel.items.length === 0) {
      this.errorMessage = `No parent node available in Level ${levelIndex}`;
      this.modals.error = true;
      return;
    }

    // Open Parent Selection Modal
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
    // Filter true values
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
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      // Reset Node State
      const item = event.container.data[event.currentIndex];
      delete item.parentId;
      delete item.permissions;
    }
    this.drawLines();
  }


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
      nameZh: this.tempNode.nameCh, // ใช้ nameCh จาก Temp
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

    // 1. Remove main node
    const lvl = this.levels[levelIdx];
    lvl.items = lvl.items.filter(n => n.id !== node.id);
    this.resetAndPushToPool(node);

    // 2. Remove descendants
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

  save() {
    console.log('Structure Saved:', this.levels);
  }
}
