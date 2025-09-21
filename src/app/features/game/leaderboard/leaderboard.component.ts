import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { User } from '../../../core/models/user';
import { CategoryRanking, LeaderboardEntry, UserRankingStats } from '../../../core/models/ranking';
import { Category } from '../../../core/models/category';
import { RankingService } from '../../../core/services/ranking.service';
import { CategoryService } from '../../../core/services/category.service';
import { UserService } from '../../../core/services/user.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Services


// Models


interface TimeFilter {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    TabViewModule,
    DropdownModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    ProgressBarModule,
    TooltipModule,
    SkeletonModule,
    InputTextModule,
    SelectButtonModule,
    DividerModule,
    RippleModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  // Data
  currentUser: User | null = null;
  leaderboard: LeaderboardEntry[] = [];
  topUsers: LeaderboardEntry[] = [];
  categoryRankings: CategoryRanking[] = [];
  userStats: UserRankingStats | null = null;
  weeklyChampions: any[] = [];
  risingStars: any[] = [];

  // UI State
  loading = true;
  activeTabIndex = 0;

  // Filters
  selectedTimeFilter = 'all';
  selectedCategory: string | null = null;
  searchTerm = '';

  // Options
  categoryOptions: Category[] = [];
  timeFilters: TimeFilter[] = [
    { label: 'Todo', value: 'all', icon: 'pi pi-calendar' },
    { label: 'Esta Semana', value: 'week', icon: 'pi pi-clock' },
    { label: 'Este Mes', value: 'month', icon: 'pi pi-calendar-times' },
    { label: 'Este Año', value: 'year', icon: 'pi pi-calendar-plus' }
  ];

  constructor(
    private rankingService: RankingService,
    private categoryService: CategoryService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadCategories();
    this.loadRankingData();
  }

  loadCurrentUser(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.loadUserStats();
    }
  }

  loadUserStats(): void {
    if (!this.currentUser) return;

    this.rankingService.getUserRankingStats(this.currentUser.id).subscribe({
      next: (stats) => {
        this.userStats = stats;
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
      }
    });
  }

  loadCategories(): void {
    if (!this.currentUser) return;

    this.categoryService.getAvailableCategories(this.currentUser.admin_code).subscribe({
      next: (categories) => {
        this.categoryOptions = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadRankingData(): void {
    this.loading = true;

    // Mock data for demonstration
    this.loadMockData();
    
    this.loading = false;
  }

  loadMockData(): void {
    // Generate mock leaderboard data
    this.leaderboard = Array.from({ length: 50 }, (_, i) => ({
      user_id: `user_${i + 1}`,
      username: `user${i + 1}`,
      full_name: `Usuario ${i + 1}`,
      avatar_url: '',
      total_points: Math.floor(Math.random() * 2000) + 500,
      rank_position: i + 1,
      games_played: Math.floor(Math.random() * 20) + 5,
      avg_score: Math.floor(Math.random() * 40) + 60,
      level: Math.floor(Math.random() * 8) + 1,
      achievements_count: Math.floor(Math.random() * 10) + 1,
      is_current_user: this.currentUser ? i === 2 : false // Mock current user at position 3
    })).sort((a, b) => b.total_points - a.total_points);

    // Update rank positions after sorting
    this.leaderboard.forEach((user, index) => {
      user.rank_position = index + 1;
    });

    this.topUsers = this.leaderboard.slice(0, 3);

    // Mock category rankings
    this.categoryRankings = this.categoryOptions.slice(0, 4).map(category => ({
      category,
      rankings: this.leaderboard.slice(0, 10),
      total_participants: this.leaderboard.length
    }));

    // Mock weekly champions
    this.weeklyChampions = this.leaderboard.slice(0, 5).map(user => ({
      ...user,
      total_points: Math.floor(Math.random() * 300) + 100 // Points this week
    }));

    // Mock rising stars
    this.risingStars = this.leaderboard.slice(10, 15).map(user => ({
      ...user,
      improvement: Math.floor(Math.random() * 50) + 10
    }));
  }

  onTimeFilterChange(): void {
    this.loadRankingData();
  }

  onCategoryChange(): void {
    this.loadRankingData();
  }

  onSearch(): void {
    // Implement search functionality
    if (this.searchTerm) {
      // Filter leaderboard based on search term
      // For now, just reload data
      this.loadRankingData();
    }
  }

  scrollToMyPosition(): void {
    const element = document.getElementById('my-position');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  viewFullCategoryRanking(categoryId: string): void {
    // Navigate to full category ranking view
    // For now, just switch to category tab
    this.selectedCategory = categoryId;
    this.activeTabIndex = 1;
  }

  getPositionSeverity(position: number): any {
    if (position === 1) return 'warning';
    if (position === 2) return 'secondary';
    if (position === 3) return 'contrast';
    if (position <= 10) return 'info';
    return 'secondary';
  }

  getPositionIcon(position: number): any {
    switch (position) {
      case 1: return 'pi pi-crown';
      case 2: return 'pi pi-star';
      case 3: return 'pi pi-heart';
      default: return '';
    }
  }

  getPositionColor(position: number): any {
    switch (position) {
      case 1: return '#fbbf24';
      case 2: return '#9ca3af';
      case 3: return '#cd7c2f';
      default: return '#6b7280';
    }
  }

  trackByCategoryRanking(index: number, categoryRanking: CategoryRanking): any {
    return categoryRanking.category.id;
  }
}
