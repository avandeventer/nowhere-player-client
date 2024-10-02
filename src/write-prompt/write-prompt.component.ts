import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'write-prompt',
  templateUrl: './write-prompt.component.html',
  standalone: true
})
export class WritePromptComponent implements OnInit {
  @Input() gameState: string = "";
  prompt: string = "";

  constructor() {}

  ngOnInit() {
  }

  setPrompt(promptEvent: any) {
    this.prompt = promptEvent.target.value;
    console.log(this.prompt);
  }

}
