/**
 * Appends a newer client's extra player clips onto our player rig: the Season 19 `player.bmd` has the same 60 bones
 * as Season 6 and 68 more clips (284 on). The S6 clips stay as they are; each extra clip is copied with its channels
 * pointed at our rig's node of the same name.
 *
 *   bun tools/mergePlayerClips.ts <our player.glb> <S19 player.glb> <out player.glb> [first=284]
 *
 * The output carries Webzen data: it goes to the VM (ops/plan/bitacora.md), never into this repo.
 */
import { Document, NodeIO, type Node } from '@gltf-transform/core';
import { EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

export function mergeClips(ours: Document, theirs: Document, first: number): number {
  const byName = new Map<string, Node>(ours.getRoot().listNodes().map(n => [n.getName(), n]));
  const buffer = ours.getRoot().listBuffers()[0];
  const clips = theirs.getRoot().listAnimations();
  if (ours.getRoot().listAnimations().length !== first) throw new Error(`our rig has ${ours.getRoot().listAnimations().length} clips, expected ${first}`);
  let added = 0;
  for (const clip of clips.slice(first)) {
    const copy = ours.createAnimation(clip.getName());
    for (const channel of clip.listChannels()) {
      const sampler = channel.getSampler();
      const target = channel.getTargetNode();
      const node = target && byName.get(target.getName());
      if (!sampler || !node) continue;
      const input = sampler.getInput()!, output = sampler.getOutput()!;
      const s = ours.createAnimationSampler()
        .setInterpolation(sampler.getInterpolation())
        .setInput(ours.createAccessor().setType(input.getType()).setArray(input.getArray()!.slice()).setBuffer(buffer))
        .setOutput(ours.createAccessor().setType(output.getType()).setArray(output.getArray()!.slice()).setNormalized(output.getNormalized()).setBuffer(buffer));
      copy.addSampler(s).addChannel(ours.createAnimationChannel().setTargetNode(node).setTargetPath(channel.getTargetPath()!).setSampler(s));
    }
    added++;
  }
  return added;
}

if (import.meta.main) {
  const [oursPath, theirsPath, outPath, firstArg] = process.argv.slice(2);
  if (!outPath) throw new Error('uso: bun tools/mergePlayerClips.ts <nuestro player.glb> <player.glb S19> <salida> [284]');
  await MeshoptDecoder.ready;
  await MeshoptEncoder.ready;
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization])
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
  const ours = await io.read(oursPath);
  const theirs = await io.read(theirsPath);
  const added = mergeClips(ours, theirs, Number(firstArg ?? 284));
  await io.write(outPath, ours);
  console.log(`${added} clips appended: ${ours.getRoot().listAnimations().length} in ${outPath}`);
}
