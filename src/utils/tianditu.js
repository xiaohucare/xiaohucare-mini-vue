import settings from '@/settings'

/**
 * 天地图工具类
 * 提供天地图SDK的统一配置和初始化
 */
class TDTUtil {
  /**
   * 获取天地图API Key
   * @returns {string} 天地图应用Key
   */
  static getKey() {
    return settings.tdtKey
  }

  /**
   * 获取天地图SDK引入URL
   * @returns {string} SDK URL
   */
  static getSDKUrl() {
    return `http://api.tianditu.gov.cn/api?v=4.0&tk=${this.getKey()}`
  }

  /**
   * 动态加载天地图SDK
   * @returns {Promise} 加载完成后的Promise
   */
  static loadSDK() {
    return new Promise((resolve, reject) => {
      // 如果已经加载，直接返回
      if (window.T) {
        resolve(window.T)
        return
      }

      // 创建script标签
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = this.getSDKUrl()
      script.onload = () => {
        console.log('天地图SDK加载成功')
        resolve(window.T)
      }
      script.onerror = (error) => {
        console.error('天地图SDK加载失败:', error)
        reject(error)
      }
      document.head.appendChild(script)
    })
  }

  /**
   * 初始化地图
   * @param {string} containerId 地图容器ID
   * @param {Object} options 地图配置选项
   * @returns {Promise} 地图实例
   */
  static async initMap(containerId, options = {}) {
    // 加载SDK
    await this.loadSDK()

    // 默认配置
    const defaultOptions = {
      center: [116.4074, 39.9042], // 北京
      zoom: 15,
      minZoom: 1,
      maxZoom: 18
    }

    const config = { ...defaultOptions, ...options }

    // 创建地图
    const map = new window.T.Map(containerId)
    map.centerAndZoom(new window.T.LngLat(config.center[0], config.center[1]), config.zoom)

    // 添加控件
    if (options.showZoom !== false) {
      map.addControl(new window.T.Control.Zoom())
    }
    if (options.showScale !== false) {
      map.addControl(new window.T.Control.Scale())
    }
    if (options.showMapType !== false) {
      map.addControl(new window.T.Control.MapType())
    }

    return map
  }

  /**
   * 地址解析（地理编码）
   * @param {string} address 地址
   * @returns {Promise} 解析结果 {lng, lat, address}
   */
  static async geocode(address) {
    await this.loadSDK()

    return new Promise((resolve, reject) => {
      const search = new window.T.LocalSearch(null, {
        onSearchComplete: function(result) {
          if (result.getStatus() === window.T.LocalSearchResult.TL_SEARCH_RESULT_OK) {
            const pois = result.getPois()
            if (pois && pois.length > 0) {
              const poi = pois[0]
              resolve({
                lng: poi.latlng.getLng(),
                lat: poi.latlng.getLat(),
                address: poi.address || address
              })
            } else {
              reject(new Error('未找到地址'))
            }
          } else {
            reject(new Error('地址解析失败'))
          }
        }
      })
      search.search(address)
    })
  }

  /**
   * 逆地址解析（根据坐标获取地址）
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {Promise} 解析结果 {address, lng, lat}
   */
  static async reverseGeocode(lng, lat) {
    await this.loadSDK()

    return new Promise((resolve, reject) => {
      const geocoder = new window.T.Geocoder()
      geocoder.getLocation(new window.T.LngLat(lng, lat), function(result) {
        if (result.getStatus() === 0) {
          resolve({
            address: result.getAddress(),
            lng: lng,
            lat: lat
          })
        } else {
          reject(new Error('逆地址解析失败'))
        }
      })
    })
  }

  /**
   * 在地图上绘制圆形围栏
   * @param {Object} map 地图实例
   * @param {Object} options 圆形配置
   * @returns {Object} 圆形覆盖物实例
   */
  static drawCircle(map, options) {
    const { center, radius, color = 'blue', fillColor = '#0000FF', fillOpacity = 0.2 } = options
    
    const circle = new window.T.Circle(
      new window.T.LngLat(center.lng, center.lat),
      radius,
      {
        color: color,
        weight: 2,
        opacity: 0.8,
        fillColor: fillColor,
        fillOpacity: fillOpacity
      }
    )
    
    map.addOverLay(circle)
    return circle
  }

  /**
   * 在地图上绘制多边形围栏
   * @param {Object} map 地图实例
   * @param {Object} options 多边形配置
   * @returns {Object} 多边形覆盖物实例
   */
  static drawPolygon(map, options) {
    const { points, color = 'blue', fillColor = '#0000FF', fillOpacity = 0.2 } = options
    
    const lngLats = points.map(p => new window.T.LngLat(p.lng, p.lat))
    
    const polygon = new window.T.Polygon(lngLats, {
      color: color,
      weight: 2,
      opacity: 0.8,
      fillColor: fillColor,
      fillOpacity: fillOpacity
    })
    
    map.addOverLay(polygon)
    return polygon
  }

  /**
   * 添加标记点
   * @param {Object} map 地图实例
   * @param {Object} options 标记配置
   * @returns {Object} 标记实例
   */
  static addMarker(map, options) {
    const { lng, lat, icon, title, clickable = true } = options
    
    // 创建图标配置
    const markerOptions = {}
    if (icon) {
      markerOptions.icon = new window.T.Icon({
        iconUrl: icon,
        iconSize: new window.T.Point(25, 25)
      })
    }
    
    // 创建标记点
    const marker = new window.T.Marker(new window.T.LngLat(lng, lat), markerOptions)
    map.addOverLay(marker)
    
    // 如果需要显示文字标签，创建独立的 Label 覆盖物
    if (title) {
      const label = new window.T.Label({
        text: title,
        position: new window.T.LngLat(lng, lat),
        offset: new window.T.Point(15, -10), // 标签偏移量
        className: 'tdt-marker-label' // 自定义样式类
      })
      map.addOverLay(label)
      
      // 将 label 绑定到 marker 上，方便后续管理
      marker._label = label
    }
    
    return marker
  }

  /**
   * 清除地图上的所有覆盖物
   * @param {Object} map 地图实例
   */
  static clearOverlays(map) {
    map.clearOverLays()
  }

  /**
   * 移除单个标记点（包括关联的标签）
   * @param {Object} map 地图实例
   * @param {Object} marker 标记实例
   */
  static removeMarker(map, marker) {
    // 先移除关联的标签
    if (marker._label) {
      map.removeOverLay(marker._label)
      marker._label = null
    }
    // 再移除标记点
    map.removeOverLay(marker)
  }

  /**
   * 调整地图视野以适应所有标记点
   * @param {Object} map 地图实例
   * @param {Array} points 点坐标数组 [{lng, lat}, ...]
   */
  static setViewport(map, points) {
    if (!points || points.length === 0) return
    
    const lngLats = points.map(p => new window.T.LngLat(p.lng, p.lat))
    map.setViewport(lngLats)
  }

  /**
   * 创建多边形绘制工具
   * @param {Object} map 地图实例
   * @param {Object} options 绘制工具配置
   * @returns {Object} 多边形绘制工具实例
   */
  static createPolygonTool(map, options = {}) {
    const defaultOptions = {
      showLabel: true, // 显示面积信息
      color: '#409EFF',
      weight: 3,
      opacity: 0.8,
      fillColor: '#409EFF',
      fillOpacity: 0.2
    }
    
    const config = { ...defaultOptions, ...options }
    
    const polygonTool = new window.T.PolygonTool(map, config)
    return polygonTool
  }

  /**
   * 创建圆形绘制工具
   * @param {Object} map 地图实例
   * @param {Object} options 绘制工具配置
   * @returns {Object} 圆形绘制工具实例
   */
  static createCircleTool(map, options = {}) {
    const defaultOptions = {
      showLabel: true, // 显示半径和面积信息
      color: '#409EFF',
      weight: 3,
      opacity: 0.8,
      fillColor: '#409EFF',
      fillOpacity: 0.2
    }
    
    const config = { ...defaultOptions, ...options }
    
    const circleTool = new window.T.CircleTool(map, config)
    return circleTool
  }

  /**
   * 创建折线绘制工具
   * @param {Object} map 地图实例
   * @param {Object} options 绘制工具配置
   * @returns {Object} 折线绘制工具实例
   */
  static createPolylineTool(map, options = {}) {
    const defaultOptions = {
      showLabel: true,
      color: '#409EFF',
      weight: 3,
      opacity: 0.8
    }
    
    const config = { ...defaultOptions, ...options }
    
    const polylineTool = new window.T.PolylineTool(map, config)
    return polylineTool
  }

  /**
   * 创建矩形绘制工具
   * @param {Object} map 地图实例
   * @param {Object} options 绘制工具配置
   * @returns {Object} 矩形绘制工具实例
   */
  static createRectangleTool(map, options = {}) {
    const defaultOptions = {
      showLabel: true,
      color: '#409EFF',
      weight: 3,
      opacity: 0.8,
      fillColor: '#409EFF',
      fillOpacity: 0.2
    }
    
    const config = { ...defaultOptions, ...options }
    
    const rectangleTool = new window.T.RectangleTool(map, config)
    return rectangleTool
  }

  /**
   * 创建标记点绘制工具
   * @param {Object} map 地图实例
   * @param {Object} options 绘制工具配置
   * @returns {Object} 标记点绘制工具实例
   */
  static createMarkTool(map, options = {}) {
    const defaultOptions = {
      followText: '点击地图添加标记'
    }
    
    const config = { ...defaultOptions, ...options }
    
    const markTool = new window.T.MarkTool(map, config)
    return markTool
  }
}

export default TDTUtil
