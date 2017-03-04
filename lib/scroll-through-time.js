'use babel';

import { CompositeDisposable } from 'atom';

function getListener (direction) {
  let mainAxis = direction == 'left' || direction == 'right' ? 'X' : 'Y'
  let crossAxis = mainAxis == 'X' ? 'Y' : 'X'
  let reversed = direction == 'right' || direction == 'down'
  let previousScroll = 0
  let timeout
  return function (e) {
    if (Math.abs(e['delta' + mainAxis]) < Math.abs(e['delta' + crossAxis])) {
      return
    }
    previousScroll += e['delta' + mainAxis]
    clearTimeout(timeout)
    timeout = setTimeout(() => previousScroll = 0, 50)

    if (previousScroll > 50) {
      previousScroll -= 50
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor[reversed ? 'undo' : 'redo']()
      }
    } else if (previousScroll < -50) {
      previousScroll += 50
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor[reversed ? 'redo' : 'undo']()
      }
    }
  }
}

export default {

  config: {
    autoToggle: {
      title: 'Auto Toggle',
      description: 'Toggle on start.',
      type: 'boolean',
      default: true
    },
    direction: {
      title: 'Scroll direction',
      type: 'string',
      default: 'left',
      enum: [
        {value: 'left', description: 'Scroll left to undo, right to redo'},
        {value: 'right', description: 'Scroll right to undo, left to redo'},
        {value: 'up', description: 'Scroll up to undo, down to redo'},
        {value: 'down', description: 'Scroll down to undo, up to redo'},
      ],
    }
  },
  subscriptions: null,
  listener: null,
  active: false,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'scroll-through-time:toggle': () => this.toggle(),
      'scroll-through-time:enable': () => this.toggle(true),
      'scroll-through-time:disable': () => this.toggle(false)
    }));

    this.subscriptions.add(
      atom.config.observe('scroll-through-time.direction', (newValue) => {
        this.removeListener()
        this.listener = getListener(newValue)
        this.setupListener()
      }));

    if (this.getConfig('autoToggle') || state.active) {
      this.toggle(true)
    }
  },

  deactivate() {
    this.active = false
    this.removeListener()
    this.subscriptions.dispose();
  },

  serialize() {
    return {
      active: this.active
    };
  },

  setupListener() {
    window.addEventListener(
      'mousewheel',
      this.listener,
      {passive: true}
    )
  },

  removeListener() {
    window.removeEventListener('mousewheel', this.listener)
  },

  toggle(force) {
    this.active = typeof force !== 'undefined'
      ? force
      : !this.active
    return (
      this.active ?
      this.setupListener() :
      this.removeListener()
    );
  },

  getConfig (config) {
    return atom.config.get(`scroll-through-time.${config}`)
  }

};
