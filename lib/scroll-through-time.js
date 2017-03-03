'use babel';

import { CompositeDisposable } from 'atom';

function getListener (direction) {
  let previousScroll = 0
  let timeout
  return function (e) {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) { return }
    previousScroll += e.deltaX
    clearTimeout(timeout)
    timeout = setTimeout(() => previousScroll = 0, 50)

    if (previousScroll > 50) {
      previousScroll -= 50
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor[direction ? 'undo' : 'redo']()
      }
    } else if (previousScroll < -50) {
      previousScroll += 50
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor[direction ? 'redo' : 'undo']()
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
      description: 'Check: Right to left to undo; Unchecked: Right to left to redo',
      type: 'boolean',
      default: true
    }
  },
  subscriptions: null,
  listener: null,
  active: false,

  activate(state) {
    this.listener = getListener(this.getConfig('direction'))

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'scroll-through-time:toggle': () => this.toggle(),
      'scroll-through-time:enable': () => this.toggle(true),
      'scroll-through-time:disable': () => this.toggle(false)
    }));

    if (this.getConfig('autoToggle') || state.active) {
      this.toggle(true)
    }

    atom.config.onDidChange('my-package.myKey', () => {
      this.removeListener()
      this.listener = getListener(this.getConfig('direction'))
      this.setupListener()
    })
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
