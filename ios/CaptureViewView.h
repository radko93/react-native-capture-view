#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface CaptureViewView : RCTViewComponentView

- (void)captureWithCallbackId:(NSString *)callbackId
                       format:(NSString *)format
                      quality:(double)quality
                       output:(NSString *)output
                  fullContent:(BOOL)fullContent;

@end

NS_ASSUME_NONNULL_END
