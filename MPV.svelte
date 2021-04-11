<script>
  import { onDestroy, onMount } from 'svelte';
  // Importing this here requires rollup-plugin-node-builtins
  import { MpvJs } from 'mpv.js-vanilla';
  const path = require('path');
  const { remote } = require('electron');

  const handleMPVReady = (mpv) => {
    const observe = mpv.observe.bind(mpv);
    ['pause', 'time-pos', 'duration', 'eof-reached'].forEach(observe);
    mpv.property('hwdec', 'auto');
    const pathToFile =
      process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), '../../tos.mkv')
        : path.join(__dirname, 'tos.mkv');
    console.log(pathToFile);
    mpv.command('loadfile', pathToFile);
  };
  const handlePropertyChange = (name, value) => {
    if (name === 'time-pos' && seeking) {
      return;
    } else if (name === 'eof-reached' && value) {
      mpv.property('time-pos', 0);
    } else {
      state[name] = value;
    }
  };
  const toggleFullscreen = () => {
    if (state.fullscreen) {
      document.webkitExitFullscreen();
    } else {
      mpv.fullscreen();
    }
    state.fullscreen = !state.fullscreen;
  };
  const handleKeyDown = (e) => {
    e.preventDefault();
    if (e.key === 'f' || (e.key === 'Escape' && state.fullscreen)) {
      toggleFullscreen();
    } else if (state.duration) {
      mpv.keypress(e);
    }
  };

  const togglePause = (e) => {
    e.target.blur();
    if (!state.duration) return;
    mpv.property('pause', !state.pause);
  };
  const handleStop = (e) => {
    e.target.blur();
    mpv.property('pause', true);
    mpv.command('stop');
    state['time-pos'] = 0;
    state.duration = 0;
  };
  const handleSeekMouseDown = () => {
    seeking = true;
  };
  const handleSeek = (e) => {
    e.target.blur();
    const timePos = +e.target.value;
    state['time-pos'] = timePos;
    mpv.property('time-pos', timePos);
  };
  const handleSeekMouseUp = () => {
    seeking = false;
  };
  const handleLoad = (e) => {
    e.target.blur();
    const items = remote.dialog.showOpenDialog({
      filters: [
        { name: 'Videos', extensions: ['mkv', 'webm', 'mp4', 'mov', 'avi'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });
    if (items) {
      mpv.command('loadfile', items[0]);
    }
  };

  let state = { pause: false, 'time-pos': 0, duration: 0, fullscreen: false };
  let seeking = false;

  const mpv = new MpvJs(handleMPVReady, handlePropertyChange);
  let embed;
  const embedProps = mpv.getDefProps();
  onMount(() => {
    mpv.setPluginNode(embed);
    document.addEventListener('keydown', handleKeyDown, false);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeyDown, false);
    mpv.destroy();
  });
</script>

<style>
  .player {
    width: 100%;
    height: calc(100% - 40px);
  }
  .controls {
    height: 40px;
    width: 100%;
    display: flex;
  }
  .control {
    flex: 0 1;
  }
  .seek {
    flex: 1 1;
  }
</style>

<embed
  bind:this={embed}
  type={embedProps.type}
  on:mousedown={togglePause}
  class="player"
/>
<div class="controls">
  <button class="control" on:click={togglePause}>
    {state.pause ? '▶' : '❚❚'}
  </button>
  <button class="control" on:click={handleStop}>■</button>
  <input
    class="seek"
    type="range"
    min={0}
    step={0.1}
    max={state.duration}
    value={state['time-pos']}
    on:change={handleSeek}
    on:mousedown={handleSeekMouseDown}
    on:mouseup={handleSeekMouseUp}
  />
  <button class="control" on:click={handleLoad}>⏏</button>
</div>
