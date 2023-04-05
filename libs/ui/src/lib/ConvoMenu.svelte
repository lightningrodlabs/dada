<script lang="ts">
    import { Menu, Button, List, ListItem, Icon } from 'svelte-materialify';
    import { getContext } from "svelte";
    import type { DadaStore } from "./dadaStore";
    import type { EntryHashB64 } from '@holochain/client';
    import NewConvoDialog from './NewConvoDialog.svelte';
    import { mdiChevronDown, mdiImport, mdiShapeSquarePlus, mdiArchiveArrowUp } from '@mdi/js';


    let creating = false

    const { getStore } :any = getContext('tsStore');

    const store:DadaStore = getStore();
    $: convoList = store.convoList.stateStore()
    $: activeHash = store.convoList.activeConvoHash;
    $: state = store.convoList.getReadableConvoState($activeHash);
    $: archivedConvos = $convoList.convos.findIndex((convo)=>convo.status === "archived") >= 0
    $: activeConvos = $convoList.convos.findIndex((convo)=>convo.status !== "archived") >= 0

    const selectConvo = (hash: EntryHashB64) => {
        store.convoList.setActiveConvo(hash)
    }

    let fileinput;
	const onFileSelected = (e)=>{
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.addEventListener("load", async () => {
        const b = JSON.parse(reader.result as string)
        const convo = await store.convoList.makeConvo(b)
        selectConvo(convo.hashB64())
        }, false);
        reader.readAsText(file);
    };
    const unarchiveConvo = (hash: EntryHashB64) => () => {
        store.convoList.unarchiveConvo(hash)
    }
</script>

<div class="convo-menu">
<input style="display:none" type="file" accept=".json" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
<Button icon on:click={()=>creating = true} style="margin-left:10px" title="New Convo"><Icon path={mdiShapeSquarePlus} /></Button>
<Button icon on:click={()=>{fileinput.click();}} style="margin-left:10px" title="Import Convo"><Icon path={mdiImport} /></Button>
{#if activeConvos}
<Menu>
    <div slot="activator">
        <Button style="margin-left:10px">
            {#if $activeHash}
                {$state.name}
            {:else}
                <i>Choose a Convo</i>
            {/if}
            <Icon path={mdiChevronDown}></Icon>
        </Button>
    </div>
    <List>
        {#each $convoList.convos as convo }
            {#if convo.status !== "archived" }
                <ListItem dense={true} on:click={()=>selectConvo(convo.hash)}>{convo.name}</ListItem>
            {/if}
        {/each}
    </List>
</Menu>
{/if}
{#if archivedConvos}
<Menu>
    <div slot="activator">
        <Button style="margin-left:10px" title="Archived Convos">
            <Icon path={mdiArchiveArrowUp}></Icon>
            <Icon path={mdiChevronDown}></Icon>
        </Button>
    </div>
    <List>
        {#each $convoList.convos as convo }
            {#if convo.status === "archived" }
                <ListItem dense={true} on:click={unarchiveConvo(convo.hash)}>{convo.name}</ListItem>
            {/if}
        {/each}
    </List>
</Menu>
{/if}

{#if creating}
    <NewConvoDialog bind:active={creating}></NewConvoDialog>
{/if}
</div>
<style>
  .convo-menu {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }

</style>