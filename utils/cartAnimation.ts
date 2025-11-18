/**
 * Tạo hiệu ứng ảnh sản phẩm bay vào giỏ hàng
 * @param imageUrl URL của ảnh sản phẩm
 * @param startElement Element bắt đầu (ví dụ: ảnh trong bottom sheet)
 * @param endElementId ID của element đích (ví dụ: "showCartBtn")
 * @param onComplete Callback khi animation hoàn thành
 */
export function animateProductToCart(
  imageUrl: string,
  startElement: HTMLElement | null,
  endElementId: string = 'showCartBtn',
  onComplete?: () => void
) {
  if (!startElement) {
    onComplete?.()
    return
  }

  const endElement = document.getElementById(endElementId)
  if (!endElement) {
    onComplete?.()
    return
  }

  // Lưu endElement vào biến để TypeScript biết nó không null
  const targetElement = endElement as HTMLElement

  // Lấy vị trí bắt đầu và kết thúc
  const startRect = startElement.getBoundingClientRect()
  const endRect = targetElement.getBoundingClientRect()

  // Tạo element ảnh bay
  const flyingImage = document.createElement('img')
  flyingImage.src = imageUrl
  flyingImage.style.position = 'fixed'
  flyingImage.style.width = '60px'
  flyingImage.style.height = '60px'
  flyingImage.style.objectFit = 'cover'
  flyingImage.style.borderRadius = '8px'
  flyingImage.style.zIndex = '9999'
  flyingImage.style.pointerEvents = 'none'
  flyingImage.style.transition = 'none'
  flyingImage.style.left = `${startRect.left + startRect.width / 2 - 30}px`
  flyingImage.style.top = `${startRect.top + startRect.height / 2 - 30}px`
  flyingImage.style.opacity = '1'
  flyingImage.style.transform = 'scale(1)'

  document.body.appendChild(flyingImage)

  // Force reflow để đảm bảo style được apply
  flyingImage.offsetHeight

  // Tính toán vị trí đích
  const endX = endRect.left + endRect.width / 2 - 30
  const endY = endRect.top + endRect.height / 2 - 30

  // Tạo đường cong bay (bezier curve)
  const startX = startRect.left + startRect.width / 2 - 30
  const startY = startRect.top + startRect.height / 2 - 30
  
  // Điểm control cho đường cong (tạo hiệu ứng bay lên rồi xuống)
  const controlX = (startX + endX) / 2
  const controlY = Math.min(startY, endY) - 100 // Bay lên cao hơn

  // Animation với requestAnimationFrame
  const duration = 850 // milliseconds (chậm hơn một chút)
  const startTime = performance.now()

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Easing function (ease-in-out)
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2

    // Tính vị trí trên đường cong bezier
    const x = (1 - easeProgress) * (1 - easeProgress) * startX +
              2 * (1 - easeProgress) * easeProgress * controlX +
              easeProgress * easeProgress * endX
    
    const y = (1 - easeProgress) * (1 - easeProgress) * startY +
              2 * (1 - easeProgress) * easeProgress * controlY +
              easeProgress * easeProgress * endY

    // Scale nhỏ dần khi bay
    const scale = 1 - easeProgress * 0.5

    // Border radius tăng dần để tròn hoàn toàn khi đến nơi
    // Từ 8px (ban đầu) đến 50% (tròn hoàn toàn)
    const currentSize = 60 - (easeProgress * 20) // Nhỏ dần từ 60px xuống 40px
    const borderRadius = easeProgress < 0.7 
      ? 8 + (easeProgress / 0.7) * (currentSize / 2 - 8) // Tăng dần từ 8px
      : '50%' // Tròn hoàn toàn khi gần đến nơi

    flyingImage.style.left = `${x}px`
    flyingImage.style.top = `${y}px`
    flyingImage.style.width = `${currentSize}px`
    flyingImage.style.height = `${currentSize}px`
    flyingImage.style.borderRadius = typeof borderRadius === 'string' ? borderRadius : `${borderRadius}px`
    flyingImage.style.transform = `scale(${scale})`
    flyingImage.style.opacity = `${1 - easeProgress * 0.3}`

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // Animation hoàn thành
      flyingImage.remove()
      
      // Tạo hiệu ứng bounce cho icon giỏ hàng
      targetElement.style.transform = 'scale(1.2)'
      targetElement.style.transition = 'transform 0.3s ease-out'
      setTimeout(() => {
        targetElement.style.transform = 'scale(1)'
      }, 100)

      // Animation cho số lượng (cart-count sẽ được cập nhật bởi CartBottomSheet)
      const cartCountEl = targetElement.querySelector('.cart-count')
      if (cartCountEl) {
        cartCountEl.style.transform = 'scale(1.5)'
        cartCountEl.style.transition = 'transform 0.2s ease-out'
        setTimeout(() => {
          cartCountEl.style.transform = 'scale(1)'
        }, 200)
      }

      onComplete?.()
    }
  }

  requestAnimationFrame(animate)
}

