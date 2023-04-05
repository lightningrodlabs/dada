<script lang="ts">
    import { Button, Icon } from 'svelte-materialify';
    import { mdiAccountGroup } from '@mdi/js';
    import ParticipantsDialog from './ParticipantsDialog.svelte';
    import type { Avatar } from './convoList';
    import AvatarDialog from './AvatarDialog.svelte';
    import AvatarIcon from './AvatarIcon.svelte';
    import { getContext, onMount } from "svelte";
    import type { DadaStore } from "./dadaStore";
    import { cloneDeep } from "lodash";

    const { getStore } :any = getContext('tsStore');

    const store:DadaStore = getStore();
    const myAgentPubKey = store.myAgentPubKey()
    $: avatars = store.convoList.avatars()
    $: myName = $avatars[myAgentPubKey]? $avatars[myAgentPubKey].name : ""
    $: myAvatar = $avatars[myAgentPubKey]? $avatars[myAgentPubKey] : undefined
    $: participants = store.convoList.participants()
    let showParticipants = false
    let editingAvatar = false
    let avatar: Avatar = {name:"", url:""}
    
    onMount(async () => {
        if (!myName) {
            editingAvatar = true
        }
	});

    const editAvatar = () => {
        const myAvatar = $avatars[store.myAgentPubKey()]
        if (myAvatar) {
        avatar = myAvatar
        }
        editingAvatar = true
    }
    const setAvatar = (avatar: Avatar) => {
        store.convoList.requestChanges([{type:'set-avatar', pubKey:store.myAgentPubKey(), avatar:cloneDeep(avatar)}])
        editingAvatar = false
    }

</script>

<Button icon on:click={()=>{showParticipants=true}} style="margin-left:10px" title="Show Players"><Icon path={mdiAccountGroup} />{$participants.active.length }</Button>
<Button icon on:click={editAvatar} title={myName ? myName:"Edit Avatar"} style="margin-left:10px"><AvatarIcon avatar={myAvatar} border={false}></AvatarIcon></Button>

{#if showParticipants}
<ParticipantsDialog bind:active={showParticipants} avatars={$avatars} />
{/if}

{#if editingAvatar}
<AvatarDialog handleSave={setAvatar} bind:active={editingAvatar} avatar={avatar} />
{/if}