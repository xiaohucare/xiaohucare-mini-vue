<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { EZUIKitPlayer } from 'ezuikit-js';

// 定义props
interface Props {
  cameraUrl?: string;
  accessToken?: string;
  containerId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  cameraUrl: "",
  // 默认取环境变量 VITE_YS_ACCESS_TOKEN（萤石云 accessToken，请自行申请后配置在 .env.* 中）
  accessToken: import.meta.env.VITE_YS_ACCESS_TOKEN || "",
  containerId: "video-container"
});

let player: any = null;

const init = async () => {
  if (player) {
    try {
      player.destroy();
    } catch (e) {
      console.error('Destroy player error:', e);
    }
    player = null;
  }

  try {
    await nextTick();

    const container = document.getElementById(props.containerId);
    if (!container) {
      console.error(`Container element with id '${props.containerId}' not found`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`初始化播放器: ${props.containerId}`, props);

    // 获取容器元素的高度和宽度
    const containerHeight = container ? container.clientHeight : 400;
    const containerWidth = container ? container.clientWidth : '100%';

    // 创建播放器实例
    player = new EZUIKitPlayer({
      id: props.containerId,
      accessToken: props.accessToken,
      url: props.cameraUrl,
      template: "pcLive",
      height: containerHeight,
      width: containerWidth,
      handleError: (err: any) => {
        console.error("播放器错误:", err);
      },
      scaleMode: 1,
      env: {
        domain: "https://open.ys7.com",
      },
      loggerOptions: {
        level: "INFO",
        name: "ezuikit",
        showTime: true,
      },
      streamInfoCBType: 1,
    });

    // 监听事件
    if (player && player.EVENTS) {
      player.eventEmitter.on(player.EVENTS.play, () => {
        console.log('开始播放');
        // 播放开始时立即关闭声音
        setTimeout(() => {
          if (player) {
            player.closeSound();
            console.log('已默认关闭声音');
          }
        }, 100);
      });

      player.eventEmitter.on(player.EVENTS.stop, () => {
        console.log('停止播放');
      });

      player.eventEmitter.on(player.EVENTS.error, (err: any) => {
        console.error('播放错误:', err);
      });

      player.eventEmitter.on(player.EVENTS.firstFrameDisplay, () => {
        console.log('首帧显示');
        // 首帧显示时再次确保关闭声音
        setTimeout(() => {
          if (player) {
            player.closeSound();
            console.log('首帧显示后已关闭声音');
          }
        }, 100);
      });
    }

    // 默认关闭声音
    setTimeout(() => {
      if (player) {
        player.closeSound();
        console.log('初始化后已默认关闭声音');
      }
    }, 500);
  } catch (error) {
    console.error('初始化播放器失败:', error);
  }
};

const play = () => {
  player?.play();
};

const stop = () => {
  player?.stop();
};

const openSound = () => {
  player?.openSound();
};

const closeSound = () => {
  player?.closeSound();
};

const capturePicture = () => {
  player?.capturePicture(`${new Date().getTime()}`);
};

const getOSDTime = () => {
  player?.getOSDTime().then((data: any) => {
    console.log("getOSDTime 获取数据", data);
  });
};

const startSave = () => {
  player?.startSave(`${new Date().getTime()}`).then((data: any) => {
    console.log("startSave 获取数据", data);
  });
};

const stopSave = () => {
  player?.stopSave().then((data: any) => {
    console.log("stopSave 获取数据", data);
  });
};

const fullscreen = () => {
  player?.fullscreen();
};

const destroy = () => {
  if (player) {
    player.destroy().then(() => {
      console.log('播放器已销毁');
    }).catch((err: any) => {
      console.error('销毁播放器失败:', err);
    });
    player = null;
  }
};

// 监听props变化，重新初始化播放器
watch([() => props.cameraUrl, () => props.accessToken], () => {
  console.log('检测到cameraUrl或accessToken变化，重新初始化播放器');
  init();
});

onMounted(() => {
  init();
});

onUnmounted(() => {
  destroy();
});
</script>

<template>
  <div class="hello-ezuikit-js" style="width: 100%; height: 100%;">
    <div :id="props.containerId" :style="{ height: '100%', width: '100%' }"></div>
  </div>
</template>
