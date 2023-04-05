<script lang="ts">
  import { getContext } from "svelte";
  import type { DadaStore } from "./dadaStore";
  import Drawing from "./Drawing.svelte";
  import type { ConvoState, Stroke } from "./convo";
  import { onMount } from "svelte/internal";
  import { Button, Icon } from "svelte-materialify";
  import { mdiCloseBoxOutline, mdiCog, mdiExport } from "@mdi/js";
  import EditConvoDialog from "./EditConvoDialog.svelte";
  import { cloneDeep, isEqual } from "lodash";
  import { createEventDispatcher } from "svelte";
  import Canvas from "./Canvas.svelte"

  const { getStore } :any = getContext("tsStore");
  let tsStore: DadaStore = getStore();

  let dispatch = createEventDispatcher()

  $: activeHash = tsStore.convoList.activeConvoHash;
  $: state = tsStore.convoList.getReadableConvoState($activeHash);
  $: strokes = $state ? $state.strokes : undefined;

  const add = (stroke: Stroke) => {
    stroke.data.color = `rgb(${tsStore.client.myPubKey[6]},${tsStore.client.myPubKey[7]},${tsStore.client.myPubKey[8]})`
    dispatch("requestChange", [{ type: "add-stroke", stroke }]);
  }

  onMount(async () => {

	});
  const exportConvo = (state: ConvoState) => {
        const fileName = `ts_${state.name}.json`
        download(fileName, JSON.stringify(state))
        alert(`Your convo was exported to your Downloads folder as: '${fileName}'`)
    }
    
  const download = (filename: string, text: string) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  const closeConvo = () => {
    tsStore.convoList.closeActiveConvo();
  };

let editing = false

</script>

<div class="convo">
  {#if editing}
    <EditConvoDialog bind:active={editing} convoHash={cloneDeep($activeHash)}></EditConvoDialog>
  {/if}

  {#if $state}
    <div class="top-bar">
      <div class="left-items">
        <h5>{$state.name}</h5>
      </div>
      <div class="right-items">
        <Button size=small icon on:click={()=>editing=true} title="Settings">
          <Icon path={mdiCog} />
        </Button>
        <Button size=small icon on:click={() => exportConvo($state)} title="Export">
          <Icon path={mdiExport} />
        </Button>
        <Button size=small icon on:click={closeConvo} title="Close">
          <Icon path={mdiCloseBoxOutline} />
        </Button> 
      </div>
    </div>
    {#each $state.drawings as drawing}
      <Drawing drawing={drawing} strokes={$state.strokes}></Drawing>
    {/each}
    <Canvas add={add} strokes={strokes}></Canvas>
  
  {/if}

</div>

<style>

  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    border-bottom: 2px solid #bbb;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 3px 3px 0 0;
  }
  .left-items {
    display: flex;
    align-items: center;
  }
  .right-items {
    display: flex;
    align-items: center;
  }
  .convo {
    display: flex;
    flex-direction: column;
    min-height: 500px;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    background-color: #f0f0f0;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 15px;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
    }

    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
  }

</style>
