import {
    type AppAgentClient,
    type EntryHash,
    type AgentPubKeyB64,
    type AppAgentCallZomeRequest,
    type RoleName,
    encodeHashToBase64,
  } from '@holochain/client';
import type { RecordBag } from '@holochain-open-dev/utils';
import { SynStore,  SynClient, type Commit } from '@holochain-syn/core';
import { get } from "svelte/store";
import { CommitTypeConvo } from './convo';
import { ConvoList, CommitTypeConvoList } from './convoList';
import { decode } from '@msgpack/msgpack';

const ZOME_NAME = 'syn'

export class DadaService {
    constructor(public client: AppAgentClient, public roleName, public zomeName = ZOME_NAME) {}

    private callZome(fnName: string, payload: any) {
        const req: AppAgentCallZomeRequest = {
            role_name: this.roleName,
            zome_name: this.zomeName,
            fn_name: fnName,
            payload
          }
        return this.client.callZome(req);
    }
}


export class DadaStore {
    service: DadaService;
    convoList: ConvoList;
    createdConvos: Array<EntryHash> = []
    updating = false
    synStore: SynStore;
    client: AppAgentClient;
    myAgentPubKey(): AgentPubKeyB64 {
        return encodeHashToBase64(this.client.myPubKey);
    }

    constructor(
        protected clientIn: AppAgentClient,
        protected roleName: RoleName,
        protected zomeName: string = ZOME_NAME
    ) {
        this.client = clientIn
        this.service = new DadaService(
          this.client,
          this.roleName,
          this.zomeName
        );
        //@ts-ignore
        this.synStore = new SynStore(new SynClient(this.client,this.roleName,this.zomeName))
        // this.synStore.knownRoots.subscribe( async (roots) => {
        //     if (this.updating) {
        //         console.log(`${roots.entryActions.keys().length} ROOTS UPDATE CALLED but allready updating`, roots)
        //         return
        //     }
        //     this.updating = true
        //     try {
        //         await this.findOrMakeRoots(roots)
        //     } catch (e) {
        //         console.log("Error while updating convo list: ",e)
        //     }
        //     this.updating = false
        // })
    }

    commitType(commit: Commit) : string {
        const meta:any = decode(commit.meta)
        return meta.type
    }

    async findOrMakeRoots(roots: RecordBag<Commit>): Promise<any> {
        const entries = roots.entryMap.entries()
        console.log(`Found ${entries.length} root entries`)
        if (entries.length == 0) { 
            console.log(`Found no root entries, creating`)
            this.convoList = await ConvoList.Create(this.synStore);
        } else {
            let convoListRoot
            let convosRoot
                    
            entries.forEach(async ([hash, commit], i) => {
                const commitType = this.commitType(commit)
                const rootCommit = roots.entryRecords[i]
                if (commitType === CommitTypeConvoList) {
                    if (!convoListRoot) {
                        console.log("Found a convo list root:", encodeHashToBase64(rootCommit.entryHash))
                        convoListRoot = rootCommit
                    } else {
                        console.log("Found a convo list root, but have allready joined:", encodeHashToBase64(convoListRoot.entryHash))
                    }
                }
                if (commitType === CommitTypeConvo) {
                    if (!convosRoot) {
                        console.log("Found a convo root:", encodeHashToBase64(rootCommit.entryHash))
                        convosRoot = rootCommit
                    } else {
                        console.log("Found a convo root, but have allread stored: ", encodeHashToBase64(convosRoot.entryHash))
                    }
                }
            });
            if (convoListRoot && convosRoot) {
                this.convoList = await ConvoList.Join(this.synStore, convoListRoot, convosRoot)
            } else {
                console.log("Missing root, found: ", convoListRoot, convosRoot )
            }

        }
    }

    async loadConvos() : Promise<any> {
        console.log("fetching all roots...")
        try {
            const roots = await this.synStore.fetchAllRoots()
            await this.findOrMakeRoots(get(roots))
        } catch (e) {
            console.log("Error Fetching Roots:", e)
        }
    }
}