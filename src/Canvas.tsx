import * as React from "react";
import "./Canvas.scss"

export class Canvas extends React.Component {
    pos = { x: 0, y: 0 };
    canvasRef: HTMLCanvasElement | null = null;

    setPosition(e:  React.MouseEvent<HTMLCanvasElement>) {
        const { canvasRef, pos } = this;

        if (!canvasRef) return;

        const rect = canvasRef.getClientRects()[0];

        pos.x = e.clientX - rect.left;
        pos.y = e.clientY - rect.top;

        e.stopPropagation();
        e.preventDefault();
    }

    draw(e: React.PointerEvent<HTMLCanvasElement>) {
        const { canvasRef, pos } = this;
        if (!canvasRef || !pos) {
            return;
        }

        // mouse left button must be pressed
        if (!e.ctrlKey && e.buttons !== 2) 
            return;

        const ctx = canvasRef.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.beginPath(); // begin
      
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#c0392b';
      
        ctx.moveTo(pos.x, pos.y); // from
        this.setPosition(e);
        ctx.lineTo(pos.x, pos.y); // to

        ctx.stroke(); // draw it!

        e.stopPropagation();
        e.preventDefault();
    }

    resize() {
        const { canvasRef } = this;
        
        if (canvasRef) {
            const ctx = canvasRef.getContext("2d");
            if (ctx) {
                ctx.canvas.width = canvasRef.clientWidth -5;
                ctx.canvas.height = canvasRef.clientHeight -5;
                console.log("resized to ", { w: ctx.canvas.width, h: ctx.canvas.height })
            }
        }
    }

    render() {
        return <canvas 
            ref={r => {
                this.canvasRef = r;
                this.resize();

                window.addEventListener("resize", () => {
                    // this.resize();
                });
            }}
            className="draw-canvas" 
            onPointerMove={e => this.draw(e)}
            onPointerDown={e => this.setPosition(e)}
            onContextMenu={e => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onPointerEnter={e => this.setPosition(e)}
            />
    }
}