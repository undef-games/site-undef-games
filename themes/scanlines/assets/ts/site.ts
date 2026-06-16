import { mountSiteSurface } from '../../../../packages/scanlines-system/src/index'

const root = document.getElementById('scanlines-root')

if (root) {
  mountSiteSurface(root)
}
