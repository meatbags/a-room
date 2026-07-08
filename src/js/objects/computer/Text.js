/** Text */

import Config from "./Config";

class Text {
  constructor(props) {
    // props
    this.text = props.text ?? '';
    this.rows = props.rows ?? null;
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;
    this.width = props.width ?? 0;
    this.height = props.height ?? 0;
    this.hidden = props.hidden ?? false;
    this.background = props.background ?? false;
    
    // internal
    this._visible = ! this.hidden;
    this._size = null;
  }

  /** reset */
  reset() {
    this._visible = ! this.hidden;
  }

  /** reveal text */
  reveal() {
    if (this.hidden) {
      this._visible = true;
    }
  }

  /** hide */
  hide() {
    if (this.hidden) {
      this._visible = false;
    }
  }

  /** get bottom */
  getBottom() {
    return this.y + this.height;
  }

  /** draw */
  draw( ctx ) {
    if (!this._visible) {
      return;
    }

    // get size data, create rows
    if ( ! this._size ) {
      // this._size = ctx.measureText( this.rows ? this.rows[0] : this.text );
      // this._charSize = Math.ceil(this._size.width / (this.text.length || 1));
      // this._lineHeight = Math.ceil(this._size.actualBoundingBoxAscent + this._size.actualBoundingBoxDescent);
      this._size = true;
      this._charSize = Config.characterWidth;
      this._lineHeight = Config.lineHeight;
      
      if ( this.width && ! this.rows ) {
        this.rows = [''];
        let idx = 0;
        const words = this.text.split(' ');
        words.forEach(word => {
          let len = this.rows[idx].length;
          if (len !== 0 && word === '\n') {
            this.rows.push('');
            idx += 1;
            return;
          }
          if (len !== 0) {
            if ((len + word.length) * this._charSize >= this.width) {
              this.rows.push('');
              idx += 1;
            }
          }
          this.rows[idx] += word + ' ';
        });
      }
    }

    // background
    if ( this.background ) {
      const tmp = ctx.fillStyle;
      ctx.fillStyle = '#000088';
      if ( ! this.width ) {
        const w = (this.text.length + 4) * this._charSize;
        const h = this._lineHeight + 4 * this._charSize;
        ctx.fillRect( this.x - w/2, this.y - h/2, w, h );
      } else {
        // todo
      }
      ctx.fillStyle = tmp;
    }

    // text or centred rows
    if ( ! this.width ) {
      if ( this.rows ) {
        this.rows.forEach( (row, i) => {
          ctx.fillText( row, this.x, this.y + i * this._lineHeight );
        } );
      } else {
        ctx.fillText( this.text, this.x, this.y );
      }
    
    // text box
    } else {
      const tmp = ctx.textAlign;
      ctx.textAlign = 'left';
      this.rows.forEach( (row, i) => {
        ctx.fillText( row, this.x, this.y + i * this._lineHeight );
      } );
      ctx.textAlign = tmp;
    }
  }
}

export default Text;