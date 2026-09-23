export const canChangeSlide = ({ lastSlideChange, slideDuration, slideDurationRatio = 1 }) => {
    if (lastSlideChange && Date.now() - lastSlideChange < slideDuration * slideDurationRatio) {
        console.warn("Can't change slide yet, too soon");
        return false;
    }
    return true;
};
