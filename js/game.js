const $ = (id) => document.getElementById(id);

class StoryEngine {
  constructor() {
    this.background = $('background');
    this.characters = $('characters');
    this.eventImage = $('event-image');
    this.effects = $('effects');
    this.dialogue = $('dialogue');
    this.speaker = $('speaker');
    this.text = $('text');
    this.choices = $('choices');
    this.next = $('next');
    this.title = $('title-screen');
    this.index = 0;
    this.commands = [];
    this.labels = new Map();
    this.waitingForInput = false;
    this.running = false;

    this.next.addEventListener('click', () => this.advance());
  }

  async start(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Scenario load failed: ${response.status}`);
    const data = await response.json();
    this.load(data);
    this.title.hidden = true;
    this.running = true;
    await this.advance();
  }

  load(data) {
    this.commands = Array.isArray(data) ? data : data.commands || [];
    this.labels.clear();
    this.commands.forEach((command, index) => {
      if (command.type === 'label' && command.id) this.labels.set(command.id, index);
    });
    this.index = 0;
  }

  async advance() {
    if (!this.running || this.waitingForInput) return;
    while (this.index < this.commands.length) {
      const command = this.commands[this.index++];
      if (await this.execute(command)) return;
    }
    this.running = false;
  }

  async execute(command) {
    switch (command.type) {
      case 'background':
        this.background.src = command.src;
        this.background.alt = command.alt || '';
        return false;

      case 'character':
        return this.showCharacter(command);

      case 'removeCharacter':
        this.removeCharacter(command.id);
        return false;

      case 'dialogue':
        this.showDialogue(command.character || '', command.text || '');
        return true;

      case 'choice':
        this.showChoices(command.options || []);
        return true;

      case 'image':
        this.eventImage.src = command.src || '';
        this.eventImage.alt = command.alt || '';
        this.eventImage.hidden = !command.src;
        return false;

      case 'clearImage':
        this.eventImage.hidden = true;
        this.eventImage.removeAttribute('src');
        return false;

      case 'wait':
        await this.sleep(Number(command.ms) || 0);
        return false;

      case 'effect':
        this.effect(command.name);
        return false;

      case 'goto':
        if (this.labels.has(command.target)) this.index = this.labels.get(command.target) + 1;
        return false;

      case 'label':
        return false;

      default:
        console.warn('Unknown story command:', command);
        return false;
    }
  }

  showDialogue(character, text) {
    this.speaker.textContent = character;
    this.text.textContent = text;
    this.choices.replaceChildren();
    this.next.hidden = false;
    this.dialogue.hidden = false;
    this.waitingForInput = true;
  }

  showChoices(options) {
    this.speaker.textContent = '';
    this.text.textContent = 'どうする？';
    this.next.hidden = true;
    this.choices.replaceChildren();
    this.dialogue.hidden = false;
    this.waitingForInput = true;

    for (const option of options) {
      const button = document.createElement('button');
      button.className = 'choice';
      button.type = 'button';
      button.textContent = option.text || '選択';
      button.addEventListener('click', () => {
        this.choices.replaceChildren();
        this.dialogue.hidden = true;
        this.waitingForInput = false;
        if (option.target && this.labels.has(option.target)) {
          this.index = this.labels.get(option.target) + 1;
        }
        this.advance();
      }, { once: true });
      this.choices.append(button);
    }
  }

  async showCharacter(command) {
    if (!command.id || !command.src) return false;
    let image = document.querySelector(`[data-character-id="${CSS.escape(command.id)}"]`);
    if (!image) {
      image = document.createElement('img');
      image.className = 'character';
      image.dataset.characterId = command.id;
      image.alt = command.alt || command.id;
      this.characters.append(image);
    }
    image.src = command.src;
    image.alt = command.alt || command.id;
    image.style.left = this.position(command.position);
    image.classList.toggle('dim', Boolean(command.dim));
    image.style.opacity = command.opacity ?? '1';
    return false;
  }

  removeCharacter(id) {
    const image = document.querySelector(`[data-character-id="${CSS.escape(id)}"]`);
    if (image) image.remove();
  }

  position(position) {
    const positions = { left: '25%', center: '50%', right: '75%' };
    return positions[position] || (typeof position === 'string' && position.endsWith('%') ? position : '50%');
  }

  effect(name) {
    if (name === 'flash') {
      const node = document.createElement('div');
      node.className = 'effect-flash';
      this.effects.append(node);
      node.addEventListener('animationend', () => node.remove(), { once: true });
    }
  }

  sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

const engine = new StoryEngine();

$('start').addEventListener('click', async () => {
  try {
    await engine.start('data/scenarios/prologue.json');
  } catch (error) {
    console.error(error);
    alert('シナリオを読み込めませんでした。\nGitHub Pagesで実行する場合は、リポジトリ内のファイル構成を確認してください。');
  }
});
