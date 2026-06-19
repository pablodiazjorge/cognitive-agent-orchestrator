import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentStreamService } from '../../core/services/agent-stream.service';
import { AgentEventType } from '../../core/models/agent-event.model';

@Component({
  selector: 'app-agent-thoughts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-thoughts.component.html',
  styleUrls: ['./agent-thoughts.component.scss']
})
export class AgentThoughtsComponent {
  readonly streamService = inject(AgentStreamService);

  labelFor(type: AgentEventType): string {
    switch (type) {
      case 'thinking': return 'Thinking';
      case 'tool_call': return 'Tool call';
      case 'tool_result': return 'Tool result';
      case 'error': return 'Error';
      default: return 'Event';
    }
  }
}
