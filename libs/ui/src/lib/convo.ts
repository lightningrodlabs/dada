import type { RootStore, SynGrammar, WorkspaceStore } from "@holochain-syn/core";
import { get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import { type AgentPubKey, type EntryHash, type AgentPubKeyB64, type EntryHashB64, type decodeHashFromBase64, encodeHashToBase64 } from "@holochain/client";
import type { Dictionary } from "@holochain-open-dev/core-types";
  

export type Stroke = {
  agent: AgentPubKeyB64;
  data: any;
};

export type Drawing = {
  title: string
  agent: AgentPubKeyB64;
  parentDrawing: number;
  start: number;
  end: number;
  comments: Array<string>;
};

export interface ConvoState {
  name: string
  strokes: Array<Stroke>
  drawings: Array<Drawing>
}

export type ConvoDelta =
  | {
      type: "add-stroke"
      stroke: Stroke
  }
  | {
      type: "add-drawing"
      drawing: Drawing
  }
  | {
      type: "add-comment"
      drawingIdx: number
      comment: string
  }


export type ConvoGrammar = SynGrammar<
  ConvoDelta,
  ConvoState
  >;
export const convoGrammar: ConvoGrammar = {
  initState(state)  {
      state.name="fish"
      state.strokes = []
      state.drawings = []
  },
  applyDelta( 
      delta: ConvoDelta,
      state: ConvoState,
      _ephemeralState: any,
      _author: AgentPubKey
  ) {
      if (delta.type == "add-stroke") {
          state.strokes.push(delta.stroke)
      } 
      if (delta.type == "add-drawing") {
          state.drawings.push(delta.drawing)
      } 
      if (delta.type == "add-comment") {
          state.drawings[delta.drawingIdx].comments.push(delta.comment)
      } 
  }
};   

export const CommitTypeConvo :string = "convo"

export class Convo {    
    constructor(public workspace: WorkspaceStore<ConvoGrammar>) {
    }

    public static async Create(rootStore: RootStore<ConvoGrammar>) {
        const workspaceHash = await rootStore.createWorkspace(
            `${new Date}`,
            rootStore.root.entryHash
           );
        const me = new Convo(await rootStore.joinWorkspace(workspaceHash));
        return me
    }

    hash() : EntryHash {
        return this.workspace.workspaceHash
    }
    hashB64() : EntryHashB64 {
        return encodeHashToBase64(this.workspace.workspaceHash)
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    state(): ConvoState {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<ConvoDelta>) {
        console.log("REQUESTING CONVO CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }
}
