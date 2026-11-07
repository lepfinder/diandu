import { buildSocialLayer, type ReaderSocialLayer } from '@classic/reader';
import socialJson from '@/data/weread-social.json';

export function getXiyoujiSocialLayer(): ReaderSocialLayer {
  return buildSocialLayer(socialJson);
}
