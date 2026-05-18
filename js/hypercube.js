
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function hexToRgba(hex, alpha) {
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(255, 255, 255, ${alpha})`;
}


function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function hexToRgba(hex, alpha) {
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(255, 255, 255, ${alpha})`;
}

// 4D Hypercube visualization with 3D projection




/** Renders rotating 4D hypercube projected to 2D canvas */
export class Hypercube {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.scrollProgress = 0;
        this.autoRotation = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.time = 0;
        this.isVisible = true;
        this.animationId = null;
        
        const style = getComputedStyle(document.documentElement);
        this.primaryColor = style.getPropertyValue('--primary')?.trim() || '#06b6d4';
        this.secondaryColor = style.getPropertyValue('--secondary')?.trim() || '#8b5cf6';
        this.tertiaryColor = style.getPropertyValue('--accent')?.trim() || '#10b981';
        
        this.cosmic = null;
        
        // 4D hypercube vertices
        this.vertices4D = [
            [-1, -1, -1, -1], [1, -1, -1, -1], [1, 1, -1, -1], [-1, 1, -1, -1],
            [-1, -1, 1, -1], [1, -1, 1, -1], [1, 1, 1, -1], [-1, 1, 1, -1],
            [-1, -1, -1, 1], [1, -1, -1, 1], [1, 1, -1, 1], [-1, 1, -1, 1],
            [-1, -1, 1, 1], [1, -1, 1, 1], [1, 1, 1, 1], [-1, 1, 1, 1]
        ];
        
        // Edges connecting vertices
        this.edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7],
            [8, 9], [9, 10], [10, 11], [11, 8],
            [12, 13], [13, 14], [14, 15], [15, 12],
            [8, 12], [9, 13], [10, 14], [11, 15],
            [0, 8], [1, 9], [2, 10], [3, 11],
            [4, 12], [5, 13], [6, 14], [7, 15]
        ];
        
        this.init();
    }
    
    /** Sets up canvas, events, and starts animation loop */
    init() {
        this.resize();
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.cosmic = null;
        this.animate();
    }
    
    /** Pauses rendering when canvas is off-screen */
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (this.isVisible && !this.animationId) {
                    this.animate();
                } else if (!this.isVisible && this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(this.canvas);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) * 0.18;
        
        if (this.cosmic) this.cosmic.resize();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', throttle(() => this.resize(), 250));
        
        window.addEventListener('scroll', throttle(() => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            this.scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        }, 50), { passive: true });
        
        window.addEventListener('mousemove', throttle((e) => {
            this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }, 50), { passive: true });
    }
    
    /** Rotates 4D point in specified plane */
    rotate4D(point, angle, i, j) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const result = [...point];
        result[i] = point[i] * cos - point[j] * sin;
        result[j] = point[i] * sin + point[j] * cos;
        return result;
    }
    
    /** Projects 4D point to 3D */
    project4Dto3D(point) {
        const w = 2;
        const distance4D = 2;
        const factor = distance4D / (distance4D - point[3] / w);
        return [point[0] * factor, point[1] * factor, point[2] * factor];
    }
    
    /** Projects 3D point to 2D canvas */
    project3Dto2D(point) {
        const distance3D = 4;
        const factor = distance3D / (distance3D - point[2]);
        return [
            point[0] * factor * this.scale + this.centerX,
            point[1] * factor * this.scale + this.centerY,
            factor
        ];
    }
    
    /** Applies all rotations and projections to a vertex */
    transformVertex(vertex) {
        let point = [...vertex];
        const scrollAngle = this.scrollProgress * Math.PI * 4;
        const autoAngle = this.autoRotation;
        
        point = this.rotate4D(point, scrollAngle + autoAngle * 0.5, 0, 3);
        point = this.rotate4D(point, scrollAngle * 0.7 + autoAngle * 0.3, 1, 3);
        point = this.rotate4D(point, autoAngle * 0.4, 2, 3);
        point = this.rotate4D(point, autoAngle * 0.2 + this.mouseX * 0.3, 0, 1);
        point = this.rotate4D(point, autoAngle * 0.3 + this.mouseY * 0.3, 0, 2);
        point = this.rotate4D(point, scrollAngle * 0.5, 1, 2);
        
        const point3D = this.project4Dto3D(point);
        return this.project3Dto2D(point3D);
    }
    
    /** Returns edge color based on index and depth */
    getEdgeColor(index, depth) {
        const alpha = 0.3 + depth * 0.4;
        
        if (index < 12) return hexToRgba(this.primaryColor, alpha);
        if (index < 24) return hexToRgba(this.secondaryColor, alpha);
        return hexToRgba(this.tertiaryColor, alpha);
    }
    
    draw() {
        this.ctx.fillStyle = 'rgba(10, 10, 15, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Simplified cosmic background - static stars only
        if (this.cosmic) this.cosmic.drawSimplified(this.time);
        
        const projected = this.vertices4D.map(v => this.transformVertex(v));
        
        this.edges.forEach((edge, index) => {
            const p1 = projected[edge[0]];
            const p2 = projected[edge[1]];
            const avgDepth = (p1[2] + p2[2]) / 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1[0], p1[1]);
            this.ctx.lineTo(p2[0], p2[1]);
            this.ctx.strokeStyle = this.getEdgeColor(index, avgDepth);
            this.ctx.lineWidth = 1 + avgDepth * 1.5;
            this.ctx.stroke();
        });
        
        projected.forEach((point, index) => {
            const size = 2 + point[2] * 3;
            const alpha = 0.5 + point[2] * 0.5;
            let color;
            
            if (index < 8) {
                color = hexToRgba(this.primaryColor, alpha);
            } else {
                color = hexToRgba(this.secondaryColor, alpha);
            }
            
            this.ctx.beginPath();
            this.ctx.arc(point[0], point[1], size, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
        });
    }
    
    animate() {
        if (this.isVisible) {
            this.autoRotation += 0.008;
            this.time += 16;
            this.draw();
        }
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

export function initHypercube() {
    return new Hypercube('hypercube-canvas');
}
