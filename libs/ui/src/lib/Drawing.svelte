<script lang="ts">
  import type { Stroke, Drawing } from "./convo";

  export let strokes: Array<Stroke>
  export let drawing: Drawing
  
</script>


<div class="map">
    
      {JSON.stringify(drawing)}
      
</div>

<style>
  .map {
    margin: 0;
    border: solid 1px;
    cursor: grab;
  }
</style>