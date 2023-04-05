<script lang="ts">
  import type { Stroke } from "./convo";

  export let strokes: Array<Stroke>   = []
  export let add: (stroke:Stroke)=> void

  let scale: number = 1.0

  const addDot = (e:MouseEvent) => {
    e.stopPropagation() 
    const stroke = {agent:"",data:{x:e.offsetX, y:e.offsetY}}
    add(stroke)
  }
</script>
  
  
  <div class="canvas">
    <svg 
    viewBox={`${0*scale} ${0*scale} ${600*scale} ${400*scale}`}
    on:click={addDot}>

    {#each strokes as stroke}
    <circle 
    cx="{stroke.data.x}" 
    cy="{stroke.data.y}" r="10"
    fill="{stroke.data.color}"
    class="dot"
    />
    {/each}
    </svg>
        
  </div>
  
  <style>
    .canvas {
      margin: 0;
      border: solid 1px;
      width:600px;
      height:400px;
      cursor: pointer;
    }
    .dot {
        stroke:black;
        stroke-width: 1;
    }

  </style>