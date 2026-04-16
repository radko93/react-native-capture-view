#import <RNCaptureViewSpec/RNCaptureViewSpec.h>

NS_ASSUME_NONNULL_BEGIN

@interface CaptureModule : NSObject <NativeCaptureModuleSpec>

/// Called by CaptureViewView when a view capture completes successfully.
+ (void)resolveCapture:(NSString *)callbackId result:(NSDictionary *)result;

/// Called by CaptureViewView when a view capture fails.
+ (void)rejectCapture:(NSString *)callbackId code:(NSString *)code message:(NSString *)message;

@end

NS_ASSUME_NONNULL_END
