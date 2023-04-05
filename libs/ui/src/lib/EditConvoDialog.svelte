<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import type { Convo, ConvoState } from './convo';
    import ConvoEditor from './ConvoEditor.svelte';
    import type { DadaStore } from "./dadaStore";
    import { getContext, onMount } from 'svelte';
    import type { EntryHashB64 } from '@holochain/client';

    export let convoHash:EntryHashB64|undefined = undefined
    let editName = ''
    onMount(async () => {

        const convo: Convo | undefined = await store.convoList.getConvo(convoHash)
        if (convo) {
            const state = convo.state()
            editName = state.name
        } else {
            console.log("convo not found:", convoHash)
        }
    })

    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:DadaStore = getStore();

    const updateConvo = (hash: EntryHashB64) => async (name: string) => {
        // ignore convo type we don't update that.
        const convo: Convo | undefined = await store.convoList.getConvo(hash)
        if (convo) {
        let changes = []
        const state: ConvoState = convo.state()
        if (state.name != name) {
            store.convoList.requestChanges([
            {
                type: 'set-name',
                hash: convo.hashB64(),
                name: name
            }
            ])
            changes.push(
            {
                type: 'set-name',
                name: name
            })
        }
        if (changes.length > 0) {
            await store.convoList.requestConvoChanges(hash,changes)
        }
        }
        close()
    }
    const archiveConvo = (hash: EntryHashB64) => () => {
        store.convoList.archiveConvo(hash)
        close()
    }
    const close = ()=>{
        active=false
        convoHash=undefined
    }

</script>
<Dialog persistent bind:active>
    <ConvoEditor title="Edit Convo" handleSave={updateConvo(convoHash)} handleDelete={archiveConvo(convoHash)} cancelEdit={close} text={editName}/>
</Dialog>
