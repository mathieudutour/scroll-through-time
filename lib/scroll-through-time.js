'use babel';

import { CompositeDisposable } from 'atom';

function getListener () {
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
        editor.undo()
      }
    } else if (previousScroll < -50) {
      previousScroll += 50
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor.redo()
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
    }
  },
  subscriptions: null,
  listener: getListener(),
  active: false,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'scroll-through-time:toggle': () => this.toggle(),
      'scroll-through-time:enable': () => this.toggle(true),
      'scroll-through-time:disable': () => this.toggle(false)
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
    console.log('setup')
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
