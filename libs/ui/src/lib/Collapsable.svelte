<script type="ts">
  import { Marked, Renderer } from "@ts-stack/markdown";
  Marked.setOptions
    ({
      renderer: new Renderer,
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: true,
      smartLists: true,
      smartypants: false
    });
  export let content = ""
  export let title = "Background"
  export let collapsed = true
  const toggle = ()=>{collapsed = !collapsed}
</script>

<style>
  .title {
    font-weight: bold;
    font-size: 110%;
    cursor: pointer;
  }
  .content {
    background-color: lightgray;
    padding: 10px;
    width: fit-content;
  }
</style>

<div class="content ">
  <div class="title" on:click={toggle}>{title} {#if collapsed}...{/if}</div>
  {#if !collapsed}
    {@html Marked.parse(content)}
  {/if}
</div>