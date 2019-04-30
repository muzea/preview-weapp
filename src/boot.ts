import preview from './preview'

window.wxPreview = preview

const mountPosition = document.getElementById('weapp') as HTMLDivElement;
const wxml = document.getElementById('input') as HTMLTextAreaElement;
const runButton = document.getElementById('run') as HTMLButtonElement;

wxml.value = `<view class="right" wx:for="{{[1, 2, 3, 4, 5, 6, 7, 8, 9]}}" wx:for-item="i">
<view class="inline" wx:for="{{[1, 2, 3, 4, 5, 6, 7, 8, 9]}}" wx:for-item="j">
  <view class="block" wx:if="{{i <= j}}">
     {{i * j}}
  </view>
</view>
</view>`;

function run() {
  preview(mountPosition, wxml.value, {});
}
runButton.addEventListener('click', run);
