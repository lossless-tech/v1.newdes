class SectionManager {
    constructor() {
        this.currentSection = null;
        this.currentArtistInfo = null;
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = document.querySelectorAll('.section');
        this.closeButtons = document.querySelectorAll('.section-close');
        this.navigation = document.querySelector('.navigation');
        
        this.init();
        this.initLetterReveal();
        this.initLogoSpacing();
        this.initRoster();
    }
    
    initLetterReveal() {
        // First pass: calculate all initial widths and find maximum
        const widthData = [];
        let maxInitialWidth = 0;
        let activeNavItem = null; // Track which nav item is clicked/active
        
        // Function to get expanded width (half viewport on desktop, smaller on mobile)
        const getExpandedWidth = () => {
            if (window.innerWidth <= 768) {
                // On mobile, expand to most of viewport, accounting for left margin (1rem = 16px)
                // Use 85vw or calculate based on viewport minus left margin
                return Math.min(window.innerWidth * 0.85, window.innerWidth - 32);
            }
            return window.innerWidth / 2; // 50vw on desktop
        };
        
        // Function to recalculate max initial width
        const recalculateMaxInitialWidth = () => {
            let max = 0;
            widthData.forEach(({ navLabel, labelText }) => {
                const computedStyle = window.getComputedStyle(navLabel);
                const fontSize = computedStyle.fontSize;
                const fontWeight = computedStyle.fontWeight;
                const letterSpacing = computedStyle.letterSpacing;
                const padding = computedStyle.padding;
                const border = computedStyle.border;
                
                const tempSpan = document.createElement('span');
                tempSpan.style.visibility = 'hidden';
                tempSpan.style.position = 'absolute';
                tempSpan.style.fontSize = fontSize;
                tempSpan.style.fontWeight = fontWeight;
                tempSpan.style.letterSpacing = letterSpacing;
                tempSpan.style.padding = padding;
                tempSpan.style.border = border;
                tempSpan.style.boxSizing = 'border-box';
                tempSpan.textContent = labelText;
                document.body.appendChild(tempSpan);
                const width = tempSpan.offsetWidth;
                document.body.removeChild(tempSpan);
                
                max = Math.max(max, width);
            });
            return max;
        };
        
        this.navItems.forEach(item => {
            const navFull = item.querySelector('.nav-full');
            const navLabel = item.querySelector('.nav-label');
            if (!navFull || !navLabel) return;
            
            const originalText = navFull.textContent.trim();
            
            // Get the label text (text node before nav-full span)
            const labelText = Array.from(navLabel.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent)
                .join('')
                .trim();
            
            // Get computed styles from nav-label to respect media queries
            const computedStyle = window.getComputedStyle(navLabel);
            const fontSize = computedStyle.fontSize;
            const fontWeight = computedStyle.fontWeight;
            const letterSpacing = computedStyle.letterSpacing;
            const padding = computedStyle.padding;
            const border = computedStyle.border;
            
            // Calculate initial width (label only) using computed styles
            const tempSpanInitial = document.createElement('span');
            tempSpanInitial.style.visibility = 'hidden';
            tempSpanInitial.style.position = 'absolute';
            tempSpanInitial.style.fontSize = fontSize;
            tempSpanInitial.style.fontWeight = fontWeight;
            tempSpanInitial.style.letterSpacing = letterSpacing;
            tempSpanInitial.style.padding = padding;
            tempSpanInitial.style.border = border;
            tempSpanInitial.style.boxSizing = 'border-box';
            tempSpanInitial.textContent = labelText;
            document.body.appendChild(tempSpanInitial);
            const initialWidth = tempSpanInitial.offsetWidth;
            document.body.removeChild(tempSpanInitial);
            
            maxInitialWidth = Math.max(maxInitialWidth, initialWidth);
            
            widthData.push({
                item,
                navFull,
                navLabel,
                originalText,
                labelText
            });
        });
        
        // Set all boxes to the same initial width
        widthData.forEach(data => {
            data.navLabel.style.width = maxInitialWidth + 'px';
        });
        
        // Function to expand and reveal a nav item
        const expandNavItem = (item, navLabel, navFull) => {
            navLabel.style.width = getExpandedWidth() + 'px';
            const letters = navFull.querySelectorAll('span');
            letters.forEach((letter, index) => {
                setTimeout(() => {
                    letter.style.opacity = '1';
                }, index * 30);
            });
        };
        
        // Function to collapse a nav item
        const collapseNavItem = (item, navLabel, navFull) => {
            navLabel.style.width = maxInitialWidth + 'px';
            const letters = navFull.querySelectorAll('span');
            letters.forEach((letter, index) => {
                setTimeout(() => {
                    letter.style.opacity = '0';
                }, (letters.length - index - 1) * 20);
            });
        };
        
        // Second pass: set up letter reveal and hover effects
        widthData.forEach(({ item, navFull, navLabel, originalText }) => {
            // Wrap each letter in a span
            navFull.innerHTML = originalText.split('').map((char, index) => {
                return char === ' ' ? ' ' : `<span style="opacity: 0; transition: opacity 0.1s ease-in ${index * 0.02}s">${char}</span>`;
            }).join('');
            
            let isHovering = false;
            
            item.addEventListener('mouseenter', () => {
                // Only expand on hover if this item is not active
                if (activeNavItem !== item) {
                    isHovering = true;
                    expandNavItem(item, navLabel, navFull);
                }
            });
            
            item.addEventListener('mouseleave', () => {
                isHovering = false;
                // Only collapse if this item is not active
                if (activeNavItem !== item) {
                    collapseNavItem(item, navLabel, navFull);
                }
            });
            
            // Store reference for click handler
            item._navLabel = navLabel;
            item._navFull = navFull;
        });
        
        // Store functions and data for use in click handler
        this.expandNavItem = expandNavItem;
        this.collapseNavItem = collapseNavItem;
        this.activeNavItem = () => activeNavItem;
        this.setActiveNavItem = (item) => {
            // Collapse previous active item
            if (activeNavItem && activeNavItem !== item) {
                collapseNavItem(activeNavItem, activeNavItem._navLabel, activeNavItem._navFull);
            }
            // Set new active item
            activeNavItem = item;
            // Expand new active item
            if (activeNavItem) {
                expandNavItem(activeNavItem, activeNavItem._navLabel, activeNavItem._navFull);
            }
        };
        this.clearActiveNavItem = () => {
            if (activeNavItem) {
                collapseNavItem(activeNavItem, activeNavItem._navLabel, activeNavItem._navFull);
                activeNavItem = null;
            }
        };
        
        // Handle window resize to update widths
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Recalculate max initial width with current styles
                const newMaxInitialWidth = recalculateMaxInitialWidth();
                maxInitialWidth = newMaxInitialWidth;
                
                // Update all nav-labels
                widthData.forEach(({ item, navLabel }) => {
                    if (item.matches(':hover')) {
                        navLabel.style.width = getExpandedWidth() + 'px';
                    } else {
                        navLabel.style.width = maxInitialWidth + 'px';
                    }
                });
            }, 100);
        });
    }
    
    initLogoSpacing() {
        const logo = document.querySelector('.logo');
        if (!logo) return;
        
        const originalText = logo.textContent.trim();
        
        const updateSpacing = () => {
            // Get computed styles from the logo element to respect media queries
            const computedStyle = window.getComputedStyle(logo);
            const fontSize = computedStyle.fontSize;
            const fontWeight = computedStyle.fontWeight;
            const textTransform = computedStyle.textTransform;
            
            // Get padding to calculate content width (text area inside padding)
            const paddingLeft = parseFloat(computedStyle.paddingLeft);
            const paddingRight = parseFloat(computedStyle.paddingRight);
            
            // Calculate target width: 50vw minus padding (content area)
            const isMobile = window.innerWidth <= 768;
            
            // Ensure logo box is exactly 50vw (or calc(100vw - 3rem) on mobile)
            logo.style.width = isMobile ? 'calc(100vw - 3rem)' : '50vw';
            
            // Get the actual computed width after setting it
            const boxWidth = logo.offsetWidth;
            const targetWidth = boxWidth - paddingLeft - paddingRight;
            
            // Calculate total width of text with current font settings but no letter-spacing
            const tempDiv = document.createElement('div');
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.position = 'absolute';
            tempDiv.style.fontSize = fontSize;
            tempDiv.style.fontWeight = fontWeight;
            tempDiv.style.textTransform = textTransform;
            tempDiv.style.letterSpacing = '0';
            tempDiv.style.whiteSpace = 'nowrap';
            tempDiv.textContent = originalText;
            document.body.appendChild(tempDiv);
            const textWidth = tempDiv.offsetWidth;
            document.body.removeChild(tempDiv);
            
            // Calculate letter-spacing needed to fill target width
            const charCount = originalText.length;
            const availableWidth = targetWidth - textWidth;
            let letterSpacing = charCount > 1 ? availableWidth / (charCount - 1) : 0;
            
            // On mobile, be more conservative with spacing to prevent overflow
            if (isMobile && letterSpacing < 0) {
                // If text is too wide, reduce letter spacing to fit
                letterSpacing = -2; // Slight negative spacing to compress if needed
            }
            
            // Ensure minimum letter-spacing to prevent overlap (0.05em minimum)
            const minSpacing = parseFloat(fontSize) * 0.05;
            const finalSpacing = Math.max(letterSpacing, minSpacing);
            
            // Apply letter-spacing
            logo.style.letterSpacing = finalSpacing + 'px';
        };
        
        updateSpacing();
        
        // Update on resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateSpacing, 100);
        });
    }
    
    init() {
        // Add click handlers to nav items
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const sectionName = item.dataset.section;
                // Set this nav item as active (keep box expanded)
                if (this.setActiveNavItem) {
                    this.setActiveNavItem(item);
                }
                this.openSection(sectionName);
            });
        });
        
        // Add click handlers to close buttons
        this.closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeSection();
            });
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentSection) {
                this.closeSection();
            }
        });
        
        // Close on background click
        this.sections.forEach(section => {
            section.addEventListener('click', (e) => {
                if (e.target === section) {
                    this.closeSection();
                }
            });
        });
    }
    
    openSection(sectionName) {
        // Close current section if open
        if (this.currentSection) {
            this.closeSection();
            // Wait for close animation before opening new one
            setTimeout(() => {
                this.activateSection(sectionName);
            }, 300);
        } else {
            this.activateSection(sectionName);
        }
    }
    
    activateSection(sectionName) {
        const targetSection = document.getElementById(sectionName);
        
        if (!targetSection) return;
        
        // Hide navigation
        this.navigation.classList.add('hidden');
        
        // Show section with slight delay for smoother transition
        setTimeout(() => {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }, 50);
    }
    
    closeSection() {
        if (!this.currentSection) return;
        
        const activeSection = document.querySelector('.section.active');
        
        if (activeSection) {
            activeSection.classList.remove('active');
            
            // Clear active nav item (collapse the box)
            if (this.clearActiveNavItem) {
                this.clearActiveNavItem();
            }
            
            // Show navigation after animation
            setTimeout(() => {
                this.navigation.classList.remove('hidden');
                this.currentSection = null;
                document.body.style.overflow = '';
            }, 600);
        }
    }
    
    initRoster() {
        const rosterItems = document.querySelectorAll('.roster-item');
        const artistInfoSections = document.querySelectorAll('.artist-info');
        const artistInfoCloseButtons = document.querySelectorAll('.artist-info-close');
        
        // Add click handlers to roster items
        rosterItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const artistId = item.dataset.artist;
                this.openArtistInfo(artistId);
            });
        });
        
        // Add click handlers to artist info close buttons
        artistInfoCloseButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeArtistInfo();
            });
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentArtistInfo) {
                this.closeArtistInfo();
            }
        });
        
        // Close on background click
        artistInfoSections.forEach(section => {
            section.addEventListener('click', (e) => {
                if (e.target === section) {
                    this.closeArtistInfo();
                }
            });
        });
    }
    
    openArtistInfo(artistId) {
        // Close current artist info if open
        if (this.currentArtistInfo) {
            this.closeArtistInfo();
            // Wait for close animation before opening new one
            setTimeout(() => {
                this.activateArtistInfo(artistId);
            }, 300);
        } else {
            this.activateArtistInfo(artistId);
        }
    }
    
    activateArtistInfo(artistId) {
        const targetArtistInfo = document.getElementById(artistId);
        
        if (!targetArtistInfo) return;
        
        // Keep section open and visible - artist info will appear on top
        // Don't change section opacity, just show artist info on top
        
        // Show artist info immediately - it will slide in on top of the section
        targetArtistInfo.classList.add('active');
        this.currentArtistInfo = artistId;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    closeArtistInfo() {
        if (!this.currentArtistInfo) return;
        
        const activeArtistInfo = document.querySelector('.artist-info.active');
        
        if (activeArtistInfo) {
            activeArtistInfo.classList.remove('active');
            
            // Section stays open and visible - no need to change opacity
            // Just close the artist info and it will slide out
            
            setTimeout(() => {
                this.currentArtistInfo = null;
                // Keep body scroll locked if section is still open
                if (!this.currentSection) {
                    document.body.style.overflow = '';
                }
            }, 600);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SectionManager();
});

