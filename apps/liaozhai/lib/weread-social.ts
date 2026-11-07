import { buildSocialLayer, type ReaderSocialLayer } from '@classic/reader';
import socialJson from '@/data/weread-social.json';

export function getLiaozhaiSocialLayer(): ReaderSocialLayer {
  return buildSocialLayer(socialJson);
}
