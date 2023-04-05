<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import ConvoEditor from './ConvoEditor.svelte';
    import type { DadaStore } from "./dadaStore";
    import { getContext } from 'svelte';

    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:DadaStore = getStore();

    const addConvo = async (name: string) => {
        const convo = await store.convoList.makeConvo({name})
        store.convoList.setActiveConvo(convo.hashB64())
        active = false
    }

</script>
<Dialog persistent bind:active>
    <ConvoEditor title="New Convo" handleSave={addConvo} cancelEdit={()=>active=false} />
</Dialog>
