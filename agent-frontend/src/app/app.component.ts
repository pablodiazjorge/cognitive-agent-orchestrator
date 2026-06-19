import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatWindowComponent } from './features/chat-window/chat-window.component';
import { AgentThoughtsComponent } from './features/agent-thoughts/agent-thoughts.component';
import { AgentStreamService } from './core/services/agent-stream.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatWindowComponent, AgentThoughtsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly streamService = inject(AgentStreamService);
}
