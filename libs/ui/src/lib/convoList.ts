import { RootStore, type Commit, type SynGrammar, type SynStore, type Workspace, type WorkspaceStore } from "@holochain-syn/core";
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from "@holochain-open-dev/core-types";
import { Convo, CommitTypeConvo, Topology } from "./convo";
import type { EntryHashMap, EntryRecord } from "@holochain-open-dev/utils";
import { derived, get, writable, type Readable, type Writable } from "svelte/store";
import { convoGrammar, type ConvoDelta, type ConvoGrammar, type ConvoState } from "./convo";
import { type AgentPubKey, type EntryHash, decodeHashFromBase64 } from "@holochain/client";

export const CommitTypeConvoList :string = "convo-list"

export interface ConvoRecord {
    hash: EntryHashB64
    name: string
    status: string
}

export interface Avatar {
    name: string
    url: string
}

export interface ConvoListState {
    avatars: Dictionary<Avatar>;
    convos: ConvoRecord[];
}


export type ConvoListDelta =
  | {
    type: "add-convo";
    hash: EntryHashB64;
    name: string;
    status?: string;
  }
  | {
    type: "set-avatar";
    pubKey: AgentPubKeyB64;
    avatar: Avatar;
  }
  | {
    type: "set-name";
    hash: EntryHashB64;
    name: string;
  }
  | {
    type: "set-status";
    hash: EntryHashB64;
    status: string;
  }
  | {
    type: "set-index";
    hash: EntryHashB64;
    index: number;
  };

export type ConvoListGrammar = SynGrammar<
ConvoListDelta,
ConvoListState
>;

export const convoListGrammar: ConvoListGrammar = {
    initState(state)  {
        state.avatars = {}
        state.convos = []
    },
    applyDelta( 
        delta: ConvoListDelta,
        state: ConvoListState,
        _ephemeralState: any,
        _author: AgentPubKey
      ) {
        if (delta.type == "add-convo") {
            const record: ConvoRecord = {
                name: delta.name,
                hash: delta.hash,
                status: delta.status,
            }
            state.convos.unshift(record)
        }
        if (delta.type == "set-name") {
            state.convos.forEach((convo, i) => {
                if (convo.hash === delta.hash) {
                  state.convos[i].name = delta.name;
                }
            });
        }
        if (delta.type == "set-avatar") {
            state.avatars[delta.pubKey] = delta.avatar
        }
        if (delta.type == "set-status") {
            state.convos.forEach((convo, i) => {
                if (convo.hash === delta.hash) {
                  state.convos[i].status = delta.status;
                }
            });
        }
        if (delta.type == "set-index") {
            const index = state.convos.findIndex((convo) => convo.hash == delta.hash)
            if (index >= 0) {
              const c = state.convos[index]
              state.convos.splice(index,1)
              state.convos.splice(index, 0, c)
            }
          }
        }
    }


export class ConvoList {
    public workspace: WorkspaceStore<ConvoListGrammar>
    public convos: Dictionary<Convo>
    activeConvoHash: Writable<EntryHashB64| undefined> = writable(undefined)

    constructor(public rootStore: RootStore<ConvoListGrammar>, public convosRootStore: RootStore<ConvoGrammar>) {
        this.convos = {}
    }

    public static async Create(synStore: SynStore) {
        const rootStore = await synStore.createDeterministicRoot(convoListGrammar, {type: CommitTypeConvoList})
        const convosRootStore = await synStore.createDeterministicRoot(convoGrammar, {type: CommitTypeConvo})
        const me = new ConvoList(rootStore, convosRootStore);
        const workspaceHash = await rootStore.createWorkspace(
            'main',
            rootStore.root.entryHash
           );
        me.workspace = await rootStore.joinWorkspace(workspaceHash)
        return me
    }
    public static async Join(synStore: SynStore, rootCommit: EntryRecord<Commit>, convosRootCommit: EntryRecord<Commit>) {
        const rootStore = new RootStore(
            synStore.client,
            convoListGrammar,
            rootCommit
          );
          const convosRootStore = new RootStore(
            synStore.client,
            convoGrammar,
            convosRootCommit
          );
        const me = new ConvoList(rootStore, convosRootStore);
        const workspaces: EntryHashMap<Workspace> = get(await rootStore.fetchWorkspaces());
        // if there is no workspace then we have a problem!!
        me.workspace = await rootStore.joinWorkspace(workspaces.keys()[0]);
        return me
    }
    hash() : EntryHash {
        return this.rootStore.root.entryHash
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    stateStore() {
        return this.workspace.state
    }
    state() {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<ConvoListDelta>) {
        console.log("REQUESTING CONVOLIST CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    avatars() {
        console.log("AVATARS: ",get(this.workspace.state))
        return derived(this.workspace.state, state => state.avatars)
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }

    async requestConvoChanges(hash: EntryHashB64, deltas: ConvoDelta[]) {
        const convo = await this.getConvo(hash)
        if (convo) {
            convo.requestChanges(deltas)
        }
    }

    async requestAtiveConvoChanges(deltas: ConvoDelta[]) {
        this.requestConvoChanges(get(this.activeConvoHash), deltas)
    }

    getReadableConvoState(hash: EntryHashB64 | undefined) : Readable<ConvoState> | undefined {
        if (hash == undefined) return undefined
        return this.convos[hash].workspace.state
    }
    
    async getConvo(hash: EntryHashB64) : Promise<Convo | undefined> {
        let convo = this.convos[hash]
        if (!convo) {
            const workspaceHash = decodeHashFromBase64(hash)
            convo = this.convos[hash] = new Convo(await this.convosRootStore.joinWorkspace(workspaceHash));
        }
        return convo
    }

    async setActiveConvo(hash: EntryHashB64 | undefined) {
        let convo
        if (hash) {
            convo = await this.getConvo(hash)
            if (convo) {
                this.activeConvoHash.update((n) => {return hash} )
            }
        }
        if (!convo) {
            this.activeConvoHash.update((n) => {return undefined} )
        }
    }

    async archiveConvo(hash: EntryHashB64) {
        this.requestChanges([{type:"set-status", hash ,status:"archived"}])
        // leave convo and delete
        const convo: Convo = this.convos[hash]
        if (convo) {
            convo.workspace.leaveWorkspace()
            delete this.convos[hash]
        }
        if (get(this.activeConvoHash) == hash) {
            this.setActiveConvo(undefined)
        }
    }

    async unarchiveConvo(hash: EntryHashB64) {
        let changes : ConvoListDelta[] = 
        [
            {type:"set-status", hash ,status:""}
        ]

        this.requestChanges(changes)
    }

    closeActiveConvo() {
        this.setActiveConvo(undefined)
    }

    async makeConvo(options: any, fromHash?: EntryHashB64) : Promise<Convo> {
        const convo = await Convo.Create(this.convosRootStore)
        const workspaceStore = convo.workspace
        const convoHash = convo.hashB64()
        this.convos[convoHash] = convo 
        if (options !== undefined) {
            let changes = []
            if (options.name) {
                changes.push({
                    type: "set-name",
                    name: options.name
                })
            }
            if (changes.length > 0) {
                workspaceStore.requestChanges(changes)
                await workspaceStore.commitChanges()
            }

            this.requestChanges([{
                type: 'add-convo',
                name: convo.state().name,
                hash: convoHash,
                status: ""
            }])
        
        }
        return convo
    }
}
