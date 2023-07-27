export default class EventListener {

  __en = null
  // constructor
  constructor() {
    try {

      this.__en = new EventTarget()

    } catch (error) {

      this.__en = document

    }
  }

  // addEventListener
  addEventListener(type, listener, options) {

    this.__en.addEventListener(type, listener, options)

  }

  // dispatchEvent
  dispatchEvent(e) {

    this.__en.dispatchEvent(e)

  }

  // removeEventListener
  removeEventListener(type, listener, options) {

    this.__en.removeEventListener(type, listener, options)

  }
}