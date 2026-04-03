import { Component, HostListener, OnInit } from '@angular/core';
import { Topbar } from "./topbar/topbar";
import { SidebarComponent } from "./sidebar/sidebar";
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from "@angular/material/sidenav";
import { RouterOutlet } from "@angular/router";
import { NgClass } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { SyncCheckService } from '../../../core/services/sync-check.service';

@Component({
  selector: 'app-layout',
  imports: [Topbar, SidebarComponent, MatSidenavContainer, MatSidenav, MatSidenavContent, RouterOutlet, NgClass, SidebarComponent, MatIconModule, MatProgressBarModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  collapsed = window.innerWidth <= 768;

  constructor(public syncCheck: SyncCheckService) {}

  ngOnInit() {
    this.syncCheck.checkAndSync();
  }

  toggle() {
    this.collapsed = !this.collapsed;
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth <= 768) {
      this.collapsed = true;
    }
  }
}
