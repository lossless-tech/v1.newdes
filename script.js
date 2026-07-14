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
                // Match the logo box: viewport minus 3rem (1.5rem margin each side)
                const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
                return window.innerWidth - 3 * rem;
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
        
        // Letter reveal timing: wait for the bar to mostly finish extending
        // (width transition is 0.6s), then reveal slowly enough to follow
        const LETTER_REVEAL_DELAY = 225;
        const LETTER_STAGGER = 60;

        // Cancel any pending letter reveals/hides for an item so a quick
        // hover in/out can't fire stale timers into the wrong state
        const clearLetterTimers = (item) => {
            (item._letterTimers || []).forEach(clearTimeout);
            item._letterTimers = [];
        };

        // Function to expand and reveal a nav item
        const expandNavItem = (item, navLabel, navFull) => {
            navLabel.style.width = getExpandedWidth() + 'px';
            clearLetterTimers(item);
            const letters = navFull.querySelectorAll('span');
            letters.forEach((letter, index) => {
                item._letterTimers.push(setTimeout(() => {
                    letter.style.opacity = '1';
                }, LETTER_REVEAL_DELAY + index * LETTER_STAGGER));
            });
        };

        // Function to collapse a nav item
        const collapseNavItem = (item, navLabel, navFull) => {
            navLabel.style.width = maxInitialWidth + 'px';
            clearLetterTimers(item);
            const letters = navFull.querySelectorAll('span');
            letters.forEach((letter, index) => {
                item._letterTimers.push(setTimeout(() => {
                    letter.style.opacity = '0';
                }, (letters.length - index - 1) * 20));
            });
        };
        
        // Second pass: set up letter reveal and hover effects
        widthData.forEach(({ item, navFull, navLabel, originalText }) => {
            // Wrap each letter in a span (opacity/transition come from the
            // .nav-full span CSS rule; reveal timing is driven by JS above)
            navFull.innerHTML = originalText.split('').map(char => {
                return char === ' ' ? ' ' : `<span>${char}</span>`;
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
            // Clear inline overrides so measurements reflect the stylesheet
            logo.style.fontSize = '';
            logo.style.letterSpacing = '';

            // Get computed styles from the logo element to respect media queries
            // (width comes from CSS: 50vw desktop, calc(100vw - 3rem) mobile)
            const computedStyle = window.getComputedStyle(logo);
            const fontWeight = computedStyle.fontWeight;
            const fontFamily = computedStyle.fontFamily;
            const textTransform = computedStyle.textTransform;
            const paddingLeft = parseFloat(computedStyle.paddingLeft);
            const paddingRight = parseFloat(computedStyle.paddingRight);

            // Available width for the glyphs (content area inside padding)
            const targetWidth = logo.offsetWidth - paddingLeft - paddingRight;
            const charCount = originalText.length;
            if (charCount <= 1 || targetWidth <= 0) return;

            // Measure text width at a given font size with no letter-spacing
            const measureTextWidth = (size) => {
                const tempDiv = document.createElement('div');
                tempDiv.style.visibility = 'hidden';
                tempDiv.style.position = 'absolute';
                tempDiv.style.fontSize = size + 'px';
                tempDiv.style.fontWeight = fontWeight;
                tempDiv.style.fontFamily = fontFamily;
                tempDiv.style.textTransform = textTransform;
                tempDiv.style.letterSpacing = '0';
                tempDiv.style.whiteSpace = 'nowrap';
                tempDiv.textContent = originalText;
                document.body.appendChild(tempDiv);
                const width = tempDiv.getBoundingClientRect().width;
                document.body.removeChild(tempDiv);
                return width;
            };

            let fontSize = parseFloat(computedStyle.fontSize);
            let textWidth = measureTextWidth(fontSize);
            // Minimum letter-spacing to prevent overlap (0.05em)
            let minSpacing = fontSize * 0.05;

            // If the text can't fit even at minimum spacing, shrink the font
            // until it does (re-measure each pass — glyph widths don't scale
            // perfectly linearly due to pixel rounding)
            let attempts = 0;
            while (textWidth + minSpacing * (charCount - 1) > targetWidth && fontSize > 8 && attempts < 4) {
                fontSize *= targetWidth / (textWidth + minSpacing * (charCount - 1));
                logo.style.fontSize = fontSize + 'px';
                textWidth = measureTextWidth(fontSize);
                minSpacing = fontSize * 0.05;
                attempts++;
            }

            // Spacing that makes the glyphs span the content box exactly.
            // CSS letter-spacing also trails the last character; with
            // left-aligned text that trailing space falls invisibly past
            // the last glyph, so the glyph edges land on the padding edges.
            const letterSpacing = Math.max((targetWidth - textWidth) / (charCount - 1), minSpacing);
            logo.style.letterSpacing = letterSpacing + 'px';
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

